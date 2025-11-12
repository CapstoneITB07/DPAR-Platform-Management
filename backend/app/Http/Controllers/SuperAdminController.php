<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\AssociateGroup;
use App\Models\PendingApplication;
use App\Models\Report;
use App\Models\Notification;
use App\Models\Announcement;
use App\Models\TrainingProgram;
use App\Models\Evaluation;
use App\Models\ActivityLog;
use App\Models\DirectorHistory;
use App\Models\Volunteer;
use App\Models\CitizenAnalytics;
use App\Models\SystemSettings;
use App\Models\SystemAlert;
use App\Services\BrevoEmailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;

class SuperAdminController extends Controller
{
    /**
     * Validate username format and check for TLD patterns and reserved words
     */
    private function validateUsername($username)
    {
        // Basic format validation: alphanumeric, underscore, hyphen only (no dots)
        if (!preg_match('/^[A-Za-z0-9_-]{3,30}$/', $username)) {
            return [
                'valid' => false,
                'message' => 'Username must be 3-30 characters and contain only letters, numbers, underscore, or hyphen.'
            ];
        }

        // Check for TLD patterns (case-insensitive)
        $tlds = ['com', 'net', 'org', 'edu', 'gov', 'mil', 'int', 'co', 'io', 'ai', 'tv', 'me', 'info', 'biz', 'name', 'pro', 'xyz', 'online', 'site', 'website', 'tech', 'app', 'dev', 'cloud', 'store', 'shop'];
        $lowerUsername = strtolower($username);

        foreach ($tlds as $tld) {
            // Check if username ends with .tld or contains .tld pattern
            if (
                preg_match('/\.' . preg_quote($tld, '/') . '$/i', $lowerUsername) ||
                preg_match('/\.' . preg_quote($tld, '/') . '[^a-z0-9]/i', $lowerUsername)
            ) {
                return [
                    'valid' => false,
                    'message' => 'Username cannot contain domain extensions like .com, .net, etc.'
                ];
            }
        }

        // Check for reserved words (case-insensitive)
        $reservedWords = ['admin', 'administrator', 'root', 'system', 'superadmin', 'super', 'api', 'www', 'mail', 'email', 'support', 'help', 'info', 'contact', 'test', 'testing', 'null', 'undefined', 'true', 'false', 'delete', 'remove', 'update', 'create', 'edit', 'modify', 'user', 'users', 'account', 'accounts', 'login', 'logout', 'register', 'signup', 'password', 'reset', 'recover', 'verify', 'confirm', 'activate', 'deactivate', 'suspend', 'ban', 'block', 'unblock', 'activate', 'deactivate'];

        if (in_array($lowerUsername, $reservedWords)) {
            return [
                'valid' => false,
                'message' => 'This username is reserved and cannot be used.'
            ];
        }

        return ['valid' => true];
    }

    /**
     * Get system overview statistics
     */
    public function getSystemOverview()
    {
        try {
            $stats = [
                'total_users' => User::count(),
                'head_admins' => User::where('role', 'head_admin')->whereNull('deleted_at')->count(),
                'associate_groups' => AssociateGroup::whereNull('deleted_at')->count(),
                'pending_applications' => PendingApplication::where('status', 'pending')->count(),
                'total_reports' => Report::count(),
                'pending_reports' => Report::where('status', 'pending')->count(),
                'total_notifications' => Notification::count(),
                'total_announcements' => Announcement::count(),
                'total_training_programs' => TrainingProgram::count(),
                'total_evaluations' => Evaluation::count(),
                'active_associates' => AssociateGroup::whereNull('deleted_at')->count(),
                'system_health' => $this->checkSystemHealth(),
            ];

            return response()->json($stats);
        } catch (\Exception $e) {
            Log::error('Error fetching system overview: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch system overview'], 500);
        }
    }

    /**
     * Check system health
     */
    private function checkSystemHealth()
    {
        $health = [
            'database' => $this->checkDatabase(),
            'storage' => $this->checkStorage(),
            'cache' => $this->checkCache(),
        ];

        $overall = 'healthy';
        foreach ($health as $check) {
            if ($check !== 'healthy') {
                $overall = 'warning';
                break;
            }
        }

        // Get detailed storage information
        $storageDetails = $this->getStorageDetails();

        return [
            'status' => $overall,
            'checks' => $health,
            'storage_details' => $storageDetails
        ];
    }

    private function checkDatabase()
    {
        try {
            DB::connection()->getPdo();
            return 'healthy';
        } catch (\Exception $e) {
            return 'error';
        }
    }

    /**
     * Calculate the total size of a directory recursively
     */
    private function getDirectorySize($directory)
    {
        $size = 0;
        if (!is_dir($directory)) {
            return $size;
        }

        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($directory, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($files as $file) {
            if ($file->isFile()) {
                $size += $file->getSize();
            }
        }

        return $size;
    }

    private function checkStorage()
    {
        try {
            $storagePath = storage_path();

            // Get available disk space on the server (critical for production)
            $freeSpace = disk_free_space($storagePath);
            $totalSpace = disk_total_space($storagePath);

            if ($totalSpace == 0) {
                return 'error';
            }

            // Calculate disk usage percentage
            $usagePercent = (($totalSpace - $freeSpace) / $totalSpace) * 100;

            // For production: warn if disk usage > 90% (critical for server stability)
            // Also check if free space is less than 10GB (safety buffer)
            $minFreeSpaceGB = 10 * 1024 * 1024 * 1024; // 10GB minimum free space

            if ($usagePercent > 90 || $freeSpace < $minFreeSpaceGB) {
                return 'warning';
            }

            return 'healthy';
        } catch (\Exception $e) {
            return 'error';
        }
    }

    /**
     * Get detailed storage information
     * For production: monitors both disk space (critical) and storage directory size
     * 
     * Note: 
     * - Disk Usage includes ALL files on the server disk (database files, cache, logs, uploaded files, etc.)
     * - Storage Directory Size includes only Laravel storage folder (uploaded files, logs, backups, framework cache if file-based)
     * - Database files (MySQL/PostgreSQL) are included in disk usage but not in storage directory size
     * - Cache (if using database driver) is stored in database, not in storage directory
     */
    private function getStorageDetails()
    {
        try {
            $storagePath = storage_path();

            // Get available disk space on the server (critical for production)
            // This includes ALL files: database files, cache, logs, uploaded files, system files, etc.
            $freeSpace = disk_free_space($storagePath);
            $totalSpace = disk_total_space($storagePath);
            $usedSpace = $totalSpace - $freeSpace;
            $usagePercent = $totalSpace > 0 ? (($totalSpace - $freeSpace) / $totalSpace) * 100 : 0;

            // Calculate storage directory size (Laravel storage folder only)
            // Includes: uploaded files, logs, backups, framework cache (if file-based), sessions, etc.
            $storageSize = $this->getDirectorySize($storagePath);
            $storageSizeGB = $storageSize / (1024 * 1024 * 1024);

            // Determine status based on disk space (critical for production)
            // Warn if disk usage > 90% or free space < 10GB
            $minFreeSpaceGB = 10 * 1024 * 1024 * 1024; // 10GB minimum free space
            $status = ($usagePercent > 90 || $freeSpace < $minFreeSpaceGB) ? 'warning' : 'healthy';

            // Also check if storage directory is unusually large (> 5GB)
            $storageWarningThreshold = 5 * 1024 * 1024 * 1024; // 5GB
            $storageWarning = $storageSize > $storageWarningThreshold;

            return [
                'storage_size' => $storageSize,
                'storage_size_gb' => round($storageSizeGB, 2),
                'storage_warning' => $storageWarning,
                'free_space' => $freeSpace,
                'free_space_gb' => round($freeSpace / (1024 * 1024 * 1024), 2),
                'used_space' => $usedSpace,
                'used_space_gb' => round($usedSpace / (1024 * 1024 * 1024), 2),
                'total_space' => $totalSpace,
                'total_space_gb' => round($totalSpace / (1024 * 1024 * 1024), 2),
                'usage_percent' => round($usagePercent, 2),
                'status' => $status
            ];
        } catch (\Exception $e) {
            return [
                'storage_size' => 0,
                'storage_size_gb' => 0,
                'storage_warning' => false,
                'free_space' => 0,
                'free_space_gb' => 0,
                'used_space' => 0,
                'used_space_gb' => 0,
                'total_space' => 0,
                'total_space_gb' => 0,
                'usage_percent' => 0,
                'status' => 'error'
            ];
        }
    }

    private function checkCache()
    {
        try {
            Cache::put('health_check', 'ok', 1);
            $value = Cache::get('health_check');
            return $value === 'ok' ? 'healthy' : 'error';
        } catch (\Exception $e) {
            return 'error';
        }
    }

    /**
     * Get all head admins
     */
    public function getHeadAdmins()
    {
        try {
            // Get both active and deleted head admins for restore functionality
            $headAdmins = User::where('role', 'head_admin')
                ->withTrashed()
                ->select('id', 'name', 'username', 'email', 'created_at', 'updated_at', 'deleted_at')
                ->orderBy('deleted_at', 'asc')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($headAdmins);
        } catch (\Exception $e) {
            Log::error('Error fetching head admins: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch head admins'], 500);
        }
    }

    /**
     * Create a new head admin
     */
    public function createHeadAdmin(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'username' => ['required', 'string', 'max:30', 'min:3', 'unique:users,username'],
                'email' => 'required|string|email|max:255|unique:users,email',
                'password' => 'required|string|min:8|confirmed',
            ]);

            // Validate username format, TLD patterns, and reserved words
            $usernameValidation = $this->validateUsername($request->username);
            if (!$usernameValidation['valid']) {
                return response()->json([
                    'message' => $usernameValidation['message'],
                    'errors' => ['username' => [$usernameValidation['message']]]
                ], 422);
            }

            // Generate OTP code for email verification
            $otpCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $otpExpiresAt = now()->addHours(24); // OTP expires in 24 hours

            $headAdmin = User::create([
                'name' => $request->name,
                'username' => $request->username,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'head_admin',
                'email_verification_otp' => $otpCode,
                'email_verification_otp_expires_at' => $otpExpiresAt,
                'needs_otp_verification' => true,
            ]);

            // Send OTP email to new head admin
            try {
                $brevoService = new BrevoEmailService();
                $result = $brevoService->sendOtpEmail($request->email, $otpCode, 'Email Verification');

                if ($result['success']) {
                    Log::info('Email verification OTP sent to new head admin', [
                        'head_admin_id' => $headAdmin->id,
                        'email' => $request->email,
                        'messageId' => $result['messageId'] ?? null
                    ]);
                } else {
                    Log::error('Failed to send email verification OTP to new head admin', [
                        'head_admin_id' => $headAdmin->id,
                        'email' => $request->email,
                        'error' => $result['error'] ?? 'Unknown error'
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Exception sending OTP to new head admin', [
                    'head_admin_id' => $headAdmin->id,
                    'email' => $request->email,
                    'error' => $e->getMessage()
                ]);
            }

            // Log activity for head admin creation
            try {
                ActivityLog::logActivity(
                    Auth::id(),
                    'create',
                    'Super admin created head admin: ' . $headAdmin->name,
                    [
                        'head_admin_id' => $headAdmin->id,
                        'head_admin_name' => $headAdmin->name,
                        'head_admin_email' => $headAdmin->email,
                        'action_by' => 'super_admin'
                    ],
                    null
                );
            } catch (\Exception $e) {
                Log::error('Failed to log head admin creation activity: ' . $e->getMessage());
            }

            Log::info('Super admin created head admin', [
                'superadmin_id' => Auth::id(),
                'head_admin_id' => $headAdmin->id,
                'head_admin_email' => $headAdmin->email
            ]);

            return response()->json([
                'message' => 'Head admin created successfully. An OTP has been sent to the email address. The head admin must verify the email before they can log in.',
                'head_admin' => $headAdmin
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating head admin: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to create head admin'], 500);
        }
    }

    /**
     * Update head admin
     */
    public function updateHeadAdmin(Request $request, $id)
    {
        try {
            $headAdmin = User::where('role', 'head_admin')->whereNull('deleted_at')->findOrFail($id);
            $oldEmail = $headAdmin->email;

            $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'username' => ['sometimes', 'required', 'string', 'max:30', 'min:3', 'unique:users,username,' . $id],
                'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $id,
                'password' => 'sometimes|required|string|min:8|confirmed',
            ]);

            // Validate username format, TLD patterns, and reserved words if username is being updated
            if ($request->has('username')) {
                $usernameValidation = $this->validateUsername($request->username);
                if (!$usernameValidation['valid']) {
                    return response()->json([
                        'message' => $usernameValidation['message'],
                        'errors' => ['username' => [$usernameValidation['message']]]
                    ], 422);
                }
            }

            $updateData = [];
            $emailChanged = false;

            if ($request->has('name')) $updateData['name'] = $request->name;
            if ($request->has('username')) $updateData['username'] = $request->username;

            // Check if email is being changed
            if ($request->has('email') && $request->email !== $oldEmail) {
                $emailChanged = true;
                $newEmail = $request->email;

                // Generate OTP code
                $otpCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
                $otpExpiresAt = now()->addHours(24); // OTP expires in 24 hours

                // Store OTP in update data
                $updateData['email'] = $newEmail;
                $updateData['email_verification_otp'] = $otpCode;
                $updateData['email_verification_otp_expires_at'] = $otpExpiresAt;
                $updateData['needs_otp_verification'] = true;

                // Revoke all existing tokens to force re-login with OTP
                $headAdmin->tokens()->delete();

                // Send OTP email to new email address
                try {
                    $brevoService = new BrevoEmailService();
                    $result = $brevoService->sendOtpEmail($newEmail, $otpCode, 'Email Verification');

                    if ($result['success']) {
                        Log::info('Email verification OTP sent to head admin', [
                            'head_admin_id' => $headAdmin->id,
                            'old_email' => $oldEmail,
                            'new_email' => $newEmail,
                            'messageId' => $result['messageId'] ?? null
                        ]);
                    } else {
                        Log::error('Failed to send email verification OTP', [
                            'head_admin_id' => $headAdmin->id,
                            'new_email' => $newEmail,
                            'error' => $result['error'] ?? 'Unknown error'
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Exception sending email verification OTP', [
                        'head_admin_id' => $headAdmin->id,
                        'new_email' => $newEmail,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            if ($request->has('password')) $updateData['password'] = Hash::make($request->password);

            $headAdmin->update($updateData);

            // Log activity for head admin update
            try {
                ActivityLog::logActivity(
                    Auth::id(),
                    'update',
                    'Super admin updated head admin: ' . $headAdmin->name,
                    [
                        'head_admin_id' => $headAdmin->id,
                        'head_admin_name' => $headAdmin->name,
                        'email_changed' => $emailChanged,
                        'action_by' => 'super_admin'
                    ],
                    null
                );
            } catch (\Exception $e) {
                Log::error('Failed to log head admin update activity: ' . $e->getMessage());
            }

            Log::info('Super admin updated head admin', [
                'superadmin_id' => Auth::id(),
                'head_admin_id' => $headAdmin->id,
                'email_changed' => $emailChanged
            ]);

            $message = 'Head admin updated successfully';
            if ($emailChanged) {
                $message .= '. An OTP has been sent to the new email address. The head admin must verify the email before they can log in again.';
            }

            return response()->json([
                'message' => $message,
                'head_admin' => $headAdmin,
                'email_changed' => $emailChanged
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating head admin: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update head admin'], 500);
        }
    }

    /**
     * Delete head admin
     */
    public function deleteHeadAdmin($id)
    {
        try {
            $headAdmin = User::where('role', 'head_admin')->whereNull('deleted_at')->findOrFail($id);

            // Prevent deleting the last head admin
            $headAdminCount = User::where('role', 'head_admin')->whereNull('deleted_at')->count();
            if ($headAdminCount <= 1) {
                return response()->json([
                    'message' => 'Cannot delete the last head admin'
                ], 400);
            }

            $headAdminName = $headAdmin->name;
            // Soft delete - revoke all tokens to prevent login
            $headAdmin->tokens()->delete();
            $headAdmin->delete();

            // Log activity for head admin deletion
            try {
                ActivityLog::logActivity(
                    Auth::id(),
                    'delete',
                    'Super admin deleted head admin: ' . $headAdminName,
                    [
                        'head_admin_id' => $id,
                        'head_admin_name' => $headAdminName,
                        'action_by' => 'super_admin'
                    ],
                    null
                );
            } catch (\Exception $e) {
                Log::error('Failed to log head admin deletion activity: ' . $e->getMessage());
            }

            Log::info('Super admin soft deleted head admin', [
                'superadmin_id' => Auth::id(),
                'head_admin_id' => $id
            ]);

            return response()->json(['message' => 'Head admin deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Error deleting head admin: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to delete head admin'], 500);
        }
    }

    /**
     * Permanently delete head admin (force delete)
     */
    public function permanentDeleteHeadAdmin($id)
    {
        try {
            $headAdmin = User::where('role', 'head_admin')->withTrashed()->findOrFail($id);

            // Prevent permanently deleting the last active head admin
            $headAdminCount = User::where('role', 'head_admin')->whereNull('deleted_at')->count();
            if ($headAdminCount <= 1 && !$headAdmin->trashed()) {
                return response()->json([
                    'message' => 'Cannot permanently delete the last active head admin'
                ], 400);
            }

            // Revoke all tokens
            $headAdmin->tokens()->delete();

            // Permanently delete (force delete)
            $headAdmin->forceDelete();

            Log::warning('Super admin permanently deleted head admin', [
                'superadmin_id' => Auth::id(),
                'head_admin_id' => $id,
                'head_admin_name' => $headAdmin->name,
                'head_admin_email' => $headAdmin->email
            ]);

            return response()->json(['message' => 'Head admin permanently deleted']);
        } catch (\Exception $e) {
            Log::error('Error permanently deleting head admin: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to permanently delete head admin'], 500);
        }
    }

    /**
     * Restore soft-deleted head admin
     */
    public function restoreHeadAdmin($id)
    {
        try {
            $headAdmin = User::where('role', 'head_admin')->withTrashed()->findOrFail($id);

            if (!$headAdmin->trashed()) {
                return response()->json([
                    'message' => 'Head admin is not deleted'
                ], 400);
            }

            $headAdmin->restore();

            Log::info('Super admin restored head admin', [
                'superadmin_id' => Auth::id(),
                'head_admin_id' => $id
            ]);

            return response()->json([
                'message' => 'Head admin restored successfully',
                'head_admin' => $headAdmin
            ]);
        } catch (\Exception $e) {
            Log::error('Error restoring head admin: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to restore head admin'], 500);
        }
    }

    /**
     * Get all users with pagination
     */
    public function getAllUsers(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 15);
            $search = $request->get('search', '');
            $role = $request->get('role', '');

            $query = User::query();

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%");
                });
            }

            if ($role) {
                $query->where('role', $role);
            }

            $users = $query->select('id', 'name', 'username', 'email', 'role', 'organization', 'created_at', 'updated_at')
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json($users);
        } catch (\Exception $e) {
            Log::error('Error fetching users: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch users'], 500);
        }
    }

    /**
     * Get all associate groups
     */
    public function getAllAssociateGroups(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 15);
            $search = $request->get('search', '');
            $ageFilter = $request->get('age_filter', '');

            $query = AssociateGroup::with('user')->withTrashed();

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('director', 'like', "%{$search}%")
                        ->orWhere('type', 'like', "%{$search}%");
                });
            }

            // Filter by age (new or old)
            if ($ageFilter === 'new') {
                // New: created in the last 30 days
                $query->where('created_at', '>=', now()->subDays(30));
            } elseif ($ageFilter === 'old') {
                // Old: created more than 30 days ago
                $query->where('created_at', '<', now()->subDays(30));
            }

            $groups = $query->orderBy('created_at', 'desc')->paginate($perPage);

            foreach ($groups as $group) {
                if ($group->logo && !str_starts_with($group->logo, '/Assets/')) {
                    $group->logo = Storage::url($group->logo);
                }
            }

            return response()->json($groups);
        } catch (\Exception $e) {
            Log::error('Error fetching associate groups: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch associate groups'], 500);
        }
    }

    /**
     * Update associate group (Super Admin)
     */
    public function updateAssociateGroup(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $group = AssociateGroup::with('user')->findOrFail($id);

            if ($group->trashed()) {
                return response()->json(['message' => 'Cannot update a deleted associate group'], 400);
            }

            $validationRules = [
                'name' => 'required|string|max:255',
                'type' => 'required|string|max:255',
                'director' => 'required|string|max:255',
                'description' => 'nullable|string',
                'email' => 'required|email|max:255',
                'phone' => 'required|string|max:20|regex:/^09\d{9}$/',
            ];

            // Add password validation only if password is provided
            if ($request->has('password') && !empty($request->password)) {
                $validationRules['password'] = 'required|min:8';
                $validationRules['password_confirmation'] = 'required|same:password';
            }

            $validated = $request->validate($validationRules, [
                'name.required' => 'Organization name is required.',
                'type.required' => 'Organization type is required.',
                'director.required' => 'Director name is required.',
                'email.required' => 'Email is required.',
                'email.email' => 'Please enter a valid email address.',
                'phone.required' => 'Phone number is required.',
                'phone.regex' => 'Phone number must start with 09 and contain only numbers.',
                'password.required' => 'Password is required when changing password.',
                'password.min' => 'Password must be at least 8 characters long.',
                'password_confirmation.required' => 'Password confirmation is required.',
                'password_confirmation.same' => 'Password and confirmation do not match.',
            ]);

            // Check if director name changed
            $directorChanged = $group->director !== $validated['director'];
            $originalDirectorName = $group->director;
            $originalDirectorEmail = $group->user ? $group->user->email : null;

            // If director changed, handle director history
            if ($directorChanged && $group->user) {
                // Get the current director history record
                $currentDirectorHistory = DirectorHistory::where('associate_group_id', $group->id)
                    ->where('is_current', true)
                    ->first();

                if ($currentDirectorHistory) {
                    // Update the current record to mark it as former director with end date
                    $currentDirectorHistory->update([
                        'is_current' => false,
                        'end_date' => now()->subDay()->toDateString(),
                        'director_name' => $originalDirectorName,
                        'director_email' => $originalDirectorEmail
                    ]);

                    // Get activity summary for previous director
                    $activitySummary = $this->getDirectorActivitySummary($group->user->id);

                    // Get the actual volunteer count for the associate group during the previous director's tenure
                    $previousDirectorVolunteerCount = Volunteer::where('associate_group_id', $group->id)
                        ->where('created_at', '>=', $currentDirectorHistory->start_date)
                        ->where('created_at', '<=', now())
                        ->count();

                    // Update the former director's record with their final stats
                    $currentDirectorHistory->update([
                        'contributions' => 'Previous director - ' . $activitySummary['contributions_summary'],
                        'volunteers_recruited' => $previousDirectorVolunteerCount,
                        'reports_submitted' => $activitySummary['reports_submitted'],
                        'notifications_responded' => $activitySummary['notifications_created'],
                        'logins' => $activitySummary['total_activities']
                    ]);
                }

                // Create director history entry for new director
                $existingCurrentHistory = DirectorHistory::where('associate_group_id', $group->id)
                    ->where('director_name', $validated['director'])
                    ->where('is_current', true)
                    ->first();

                if (!$existingCurrentHistory) {
                    DirectorHistory::create([
                        'associate_group_id' => $group->id,
                        'director_name' => $validated['director'],
                        'director_email' => $originalDirectorEmail, // Keep same email, only name changes
                        'contributions' => 'New director - ' . $validated['director'],
                        'volunteers_recruited' => 0,
                        'reports_submitted' => 0,
                        'notifications_responded' => 0,
                        'logins' => 0,
                        'start_date' => now()->toDateString(),
                        'is_current' => true
                    ]);
                }
            }

            // Update associate group (don't update user account - username stays the same)
            $group->update([
                'name' => $validated['name'],
                'type' => $validated['type'],
                'director' => $validated['director'],
                'description' => $validated['description'] ?? $group->description,
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? $group->phone,
            ]);

            // Update user email and password if provided (but not username or name)
            $emailChanged = false;
            if ($group->user) {
                $userUpdateData = [];
                $oldEmail = $group->user->email;

                if ($validated['email'] !== $group->user->email) {
                    $emailChanged = true;
                    $newEmail = $validated['email'];

                    // Generate OTP code
                    $otpCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
                    $otpExpiresAt = now()->addHours(24); // OTP expires in 24 hours

                    // Store OTP in update data
                    $userUpdateData['email'] = $newEmail;
                    $userUpdateData['email_verification_otp'] = $otpCode;
                    $userUpdateData['email_verification_otp_expires_at'] = $otpExpiresAt;
                    $userUpdateData['needs_otp_verification'] = true;

                    // Revoke all existing tokens to force re-login with OTP
                    $group->user->tokens()->delete();

                    // Send OTP email to new email address
                    try {
                        $brevoService = new BrevoEmailService();
                        $result = $brevoService->sendOtpEmail($newEmail, $otpCode, 'Email Verification');

                        if ($result['success']) {
                            Log::info('Email verification OTP sent to associate', [
                                'associate_id' => $group->user->id,
                                'old_email' => $oldEmail,
                                'new_email' => $newEmail,
                                'messageId' => $result['messageId'] ?? null
                            ]);
                        } else {
                            Log::error('Failed to send email verification OTP to associate', [
                                'associate_id' => $group->user->id,
                                'new_email' => $newEmail,
                                'error' => $result['error'] ?? 'Unknown error'
                            ]);
                        }
                    } catch (\Exception $e) {
                        Log::error('Exception sending OTP to associate', [
                            'associate_id' => $group->user->id,
                            'new_email' => $newEmail,
                            'error' => $e->getMessage()
                        ]);
                    }
                }

                // Update password if provided
                if ($request->has('password') && !empty($request->password)) {
                    $userUpdateData['password'] = Hash::make($request->password);
                }

                if (!empty($userUpdateData)) {
                    $group->user->update($userUpdateData);
                }
            }

            // Log activity for associate group update by super admin
            try {
                ActivityLog::logActivity(
                    Auth::id(),
                    'update',
                    'Super admin updated associate group: ' . $group->name,
                    [
                        'associate_group_id' => $group->id,
                        'associate_group_name' => $group->name,
                        'director' => $group->director,
                        'email' => $group->email,
                        'action_by' => 'super_admin'
                    ],
                    null
                );
            } catch (\Exception $e) {
                Log::error('Failed to log associate group update activity: ' . $e->getMessage());
            }

            DB::commit();

            // Refresh and format response
            $group = $group->fresh(['user']);
            if ($group->logo && !str_starts_with($group->logo, '/Assets/')) {
                $group->logo = Storage::url($group->logo);
            }

            $message = 'Associate group updated successfully';
            if ($emailChanged) {
                $message .= '. An OTP has been sent to the new email address. The associate must verify the email before they can log in again.';
            }

            return response()->json([
                'message' => $message,
                'associate_group' => $group,
                'email_changed' => $emailChanged
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating associate group: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update associate group',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete associate group (soft delete)
     */
    public function deleteAssociateGroup($id)
    {
        DB::beginTransaction();
        try {
            $group = AssociateGroup::with('user')->findOrFail($id);

            if ($group->trashed()) {
                return response()->json(['message' => 'Associate group is already deleted'], 400);
            }

            // Revoke all tokens for the associated user
            if ($group->user) {
                $group->user->tokens()->delete();
            }

            $groupName = $group->name;
            // Soft delete
            $group->delete();

            // Log activity for associate group deletion by super admin
            try {
                ActivityLog::logActivity(
                    Auth::id(),
                    'delete',
                    'Super admin deleted associate group: ' . $groupName,
                    [
                        'associate_group_id' => $id,
                        'associate_group_name' => $groupName,
                        'action_by' => 'super_admin'
                    ],
                    null
                );
            } catch (\Exception $e) {
                Log::error('Failed to log associate group deletion activity: ' . $e->getMessage());
            }

            DB::commit();
            return response()->json(['message' => 'Associate group deleted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting associate group: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete associate group',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Permanently delete associate group
     */
    public function permanentDeleteAssociateGroup($id)
    {
        DB::beginTransaction();
        try {
            $group = AssociateGroup::with('user')->withTrashed()->findOrFail($id);

            // Revoke all tokens for the associated user
            if ($group->user) {
                $group->user->tokens()->delete();
            }

            // Permanently delete
            $group->forceDelete();

            DB::commit();
            Log::warning("Super Admin permanently deleted associate group: {$group->name} (ID: {$id})");
            return response()->json(['message' => 'Associate group permanently deleted']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error permanently deleting associate group: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to permanently delete associate group',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore associate group
     */
    public function restoreAssociateGroup($id)
    {
        try {
            $group = AssociateGroup::withTrashed()->findOrFail($id);

            if (!$group->trashed()) {
                return response()->json(['message' => 'Associate group is not deleted'], 400);
            }

            $group->restore();

            return response()->json(['message' => 'Associate group restored successfully']);
        } catch (\Exception $e) {
            Log::error('Error restoring associate group: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to restore associate group',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get director activity summary (helper method)
     */
    private function getDirectorActivitySummary($userId)
    {
        $user = User::find($userId);
        if (!$user) {
            return [
                'contributions_summary' => 'No activity data available',
                'volunteers_recruited' => 0,
                'notifications_created' => 0,
                'reports_submitted' => 0,
                'total_activities' => 0
            ];
        }

        $associateGroup = AssociateGroup::where('user_id', $userId)->first();
        if (!$associateGroup) {
            return [
                'contributions_summary' => 'No associate group found',
                'volunteers_recruited' => 0,
                'notifications_created' => 0,
                'reports_submitted' => 0,
                'total_activities' => 0
            ];
        }

        $currentDirectorHistory = DirectorHistory::where('associate_group_id', $associateGroup->id)
            ->where('is_current', true)
            ->first();

        if (!$currentDirectorHistory) {
            $notificationsCount = $user->notifications()->count();
            $reportsCount = $user->reports()->count();
            $activitiesCount = $user->activityLogs()->count();
            $volunteersCount = $user->volunteers()->count();
        } else {
            $notificationsCount = $user->notifications()
                ->where('created_at', '>=', $currentDirectorHistory->start_date)
                ->count();
            $reportsCount = $user->reports()
                ->where('created_at', '>=', $currentDirectorHistory->start_date)
                ->count();
            $activitiesCount = $user->activityLogs()
                ->where('created_at', '>=', $currentDirectorHistory->start_date)
                ->count();
            $volunteersCount = $user->volunteers()
                ->where('created_at', '>=', $currentDirectorHistory->start_date)
                ->count();
        }

        $contributions = [];
        if ($notificationsCount > 0) $contributions[] = "{$notificationsCount} notifications";
        if ($reportsCount > 0) $contributions[] = "{$reportsCount} reports";
        if ($volunteersCount > 0) $contributions[] = "{$volunteersCount} volunteers";

        return [
            'contributions_summary' => empty($contributions) ? 'No significant activities recorded' : implode(', ', $contributions),
            'volunteers_recruited' => $volunteersCount,
            'notifications_created' => $notificationsCount,
            'reports_submitted' => $reportsCount,
            'total_activities' => $activitiesCount
        ];
    }

    /**
     * Get all pending applications
     */
    public function getAllPendingApplications(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 15);
            $status = $request->get('status', 'pending');
            $search = $request->get('search', '');

            $query = PendingApplication::query();

            if ($status !== 'all') {
                $query->where('status', $status);
            }

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('organization_name', 'like', "%{$search}%")
                        ->orWhere('director_name', 'like', "%{$search}%")
                        ->orWhere('organization_type', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $applications = $query->orderBy('created_at', 'desc')->paginate($perPage);

            foreach ($applications as $app) {
                // For approved applications, get logo from associate_group table
                // since the logo was moved and renamed when approved
                if ($app->status === 'approved') {
                    $associateGroup = AssociateGroup::where('email', $app->email)->first();
                    if ($associateGroup && $associateGroup->logo) {
                        $app->logo = $associateGroup->logo;
                    }
                }
                // For rejected applications, logo remains in pending_logos/ directory
                // so we use the original logo path from pending_applications table

                if ($app->logo && !str_starts_with($app->logo, '/Assets/')) {
                    $app->logo = Storage::url($app->logo);
                } elseif (!$app->logo) {
                    $app->logo = '/Assets/disaster_logo.png';
                }
            }

            return response()->json($applications);
        } catch (\Exception $e) {
            Log::error('Error fetching pending applications: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch pending applications'], 500);
        }
    }

    /**
     * Get system logs/activity logs
     */
    public function getSystemLogs(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 50);
            $type = $request->get('type', '');
            $userId = $request->get('user_id', '');
            $startDate = $request->get('start_date', '');
            $endDate = $request->get('end_date', '');

            // Only show logs from head_admin and associate_group_leader roles
            // Exclude superadmin logs from the system logs view
            $query = ActivityLog::with('user')
                ->whereHas('user', function ($q) {
                    $q->whereIn('role', ['head_admin', 'associate_group_leader']);
                })
                ->orderBy('activity_at', 'desc');

            if ($type) {
                $query->where('activity_type', $type);
            }

            if ($userId) {
                $query->where('user_id', $userId);
            }

            if ($startDate) {
                $query->whereDate('activity_at', '>=', $startDate);
            }

            if ($endDate) {
                $query->whereDate('activity_at', '<=', $endDate);
            }

            $logs = $query->paginate($perPage);

            // Get distinct activity types from database (excluding superadmin logs)
            $dbActivityTypes = ActivityLog::select('activity_type')
                ->whereHas('user', function ($q) {
                    $q->whereIn('role', ['head_admin', 'associate_group_leader']);
                })
                ->distinct()
                ->orderBy('activity_type')
                ->pluck('activity_type')
                ->toArray();

            // Define all possible activity types in the system
            // All activity types are now being logged:
            // - login: User logged into the system
            // - logout: User logged out of the system
            // - create: Create training programs, events, etc.
            // - update: Update training programs, events, etc.
            // - delete: Delete training programs, events, etc.
            // - approve: Applications and reports approved
            // - reject: Applications and reports rejected
            // - notification_accepted: User accepted a notification/alert
            // - notification_declined: User declined a notification/alert
            // - report_submitted: User submitted a report
            // - volunteer_recruited: User recruited a new volunteer
            // - evaluation_created: Head admin evaluated an associate group
            // - evaluation_updated: Head admin updated an evaluation
            // - profile_updated: User updated their profile information or picture
            // - password_changed: User changed their password
            $allPossibleTypes = [
                'approve',                    // Approve applications/reports
                'reject',                     // Reject applications/reports
                'create',                     // Create training programs, events, etc.
                'update',                     // Update training programs, events, etc.
                'delete',                     // Delete training programs, events, etc.
                'evaluation_created',         // Head admin evaluated an associate group
                'evaluation_updated',         // Head admin updated an evaluation
                'login',                      // User logged into the system
                'logout',                     // User logged out of the system
                'notification_accepted',      // User accepted a notification/alert
                'notification_declined',      // User declined a notification/alert
                'password_changed',           // User changed their password
                'profile_updated',           // User updated their profile
                'report_submitted',           // User submitted a report
                'volunteer_recruited'         // User recruited a new volunteer
            ];

            // Merge database types with predefined types, remove duplicates
            $activityTypes = array_unique(array_merge($allPossibleTypes, $dbActivityTypes));

            // Custom sort order: Approve/Reject together, Create/Update/Delete together, then others alphabetically
            $customOrder = [
                'approve' => 1,
                'reject' => 2,
                'create' => 3,
                'update' => 4,
                'delete' => 5,
                'evaluation_created' => 6,
                'evaluation_updated' => 7,
                'login' => 8,
                'logout' => 9,
                'notification_accepted' => 10,
                'notification_declined' => 11,
                'password_changed' => 12,
                'profile_updated' => 13,
                'report_submitted' => 14,
                'volunteer_recruited' => 15
            ];

            // Sort by custom order, then alphabetically for any types not in custom order
            usort($activityTypes, function ($a, $b) use ($customOrder) {
                $orderA = $customOrder[$a] ?? 999;
                $orderB = $customOrder[$b] ?? 999;

                if ($orderA === $orderB) {
                    return strcmp($a, $b);
                }
                return $orderA <=> $orderB;
            });

            $response = $logs->toArray();
            $response['activity_types'] = array_values($activityTypes);

            return response()->json($response);
        } catch (\Exception $e) {
            Log::error('Error fetching system logs: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch system logs'], 500);
        }
    }

    /**
     * Cleanup old system logs
     */
    public function cleanupSystemLogs(Request $request)
    {
        try {
            $request->validate([
                'days_to_keep' => 'required|integer|min:1|max:3650', // Max 10 years
            ]);

            $daysToKeep = $request->input('days_to_keep');
            $cutoffDate = now()->subDays($daysToKeep);

            // Count logs to be deleted
            $logsToDelete = ActivityLog::where('activity_at', '<', $cutoffDate)->count();

            // Delete old logs
            $deleted = ActivityLog::where('activity_at', '<', $cutoffDate)->delete();

            // Log the cleanup activity
            ActivityLog::logActivity(
                Auth::id(),
                'delete',
                "Cleaned up {$deleted} system logs older than {$daysToKeep} days",
                [
                    'days_to_keep' => $daysToKeep,
                    'cutoff_date' => $cutoffDate->toDateString(),
                    'logs_deleted' => $deleted
                ],
                null
            );

            Log::info('Super admin cleaned up system logs', [
                'superadmin_id' => Auth::id(),
                'days_to_keep' => $daysToKeep,
                'logs_deleted' => $deleted
            ]);

            return response()->json([
                'message' => "Successfully deleted {$deleted} log entries older than {$daysToKeep} days",
                'logs_deleted' => $deleted,
                'cutoff_date' => $cutoffDate->toDateString()
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error cleaning up system logs: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to cleanup system logs'], 500);
        }
    }

    /**
     * Override head admin decision (approve/reject application)
     */
    public function overrideApplicationDecision(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'action' => 'required|in:approve,reject',
                'reason' => 'nullable|string|max:1000'
            ]);

            $application = PendingApplication::findOrFail($id);

            if ($request->action === 'approve') {
                // Check if already approved
                if ($application->status === 'approved') {
                    return response()->json(['message' => 'Application is already approved'], 400);
                }

                // Generate OTP code
                $otpCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
                $otpExpiresAt = now()->addHours(24); // OTP expires in 24 hours

                // Generate 3 recovery passcodes
                $recoveryPasscodes = [];
                for ($i = 0; $i < 3; $i++) {
                    $recoveryPasscodes[] = $this->generateRecoveryPasscode();
                }

                // Create user account
                $user = User::create([
                    'name' => $application->organization_name,
                    'username' => $application->username,
                    'email' => $application->email,
                    'password' => $application->password,
                    'role' => 'associate_group_leader',
                    'organization' => $application->organization_name,
                    'needs_otp_verification' => true,
                    'recovery_passcodes' => $recoveryPasscodes,
                ]);

                // Move logo from pending_logos to logos directory
                $logoPath = '/Assets/disaster_logo.png'; // Default logo
                if ($application->logo) {
                    $oldPath = $application->logo;
                    $newPath = 'logos/' . Str::random(40) . '.' . pathinfo($oldPath, PATHINFO_EXTENSION);

                    // Copy file to new location
                    if (Storage::disk('public')->exists($oldPath)) {
                        Storage::disk('public')->copy($oldPath, $newPath);
                        $logoPath = $newPath;

                        // Update user's profile picture
                        $user->update(['profile_picture' => $newPath]);

                        // Delete old file
                        Storage::disk('public')->delete($oldPath);
                    }
                }

                // Create associate group
                $associateGroup = AssociateGroup::create([
                    'user_id' => $user->id,
                    'name' => $application->organization_name,
                    'type' => $application->organization_type,
                    'director' => $application->director_name,
                    'description' => $application->description ?: 'Default description for ' . $application->organization_name,
                    'logo' => $logoPath,
                    'email' => $application->email,
                    'phone' => $application->phone,
                    'date_joined' => now()->toDateString(),
                ]);

                // Create initial director history
                DirectorHistory::create([
                    'associate_group_id' => $associateGroup->id,
                    'director_name' => $application->director_name,
                    'director_email' => $application->email,
                    'contributions' => 'Initial director - ' . $application->director_name,
                    'volunteers_recruited' => 0,
                    'reports_submitted' => 0,
                    'notifications_responded' => 0,
                    'logins' => 0,
                    'start_date' => now()->toDateString(),
                    'is_current' => true
                ]);

                // Update application status and store OTP
                $application->update([
                    'status' => 'approved',
                    'approved_at' => now(),
                    'otp_code' => $otpCode,
                    'otp_expires_at' => $otpExpiresAt,
                    'rejection_reason' => null // Clear any previous rejection reason
                ]);

                // Send OTP email to user using Brevo API
                try {
                    $brevoService = new BrevoEmailService();

                    // Render the email template
                    $htmlContent = view('emails.application-approved', [
                        'organizationName' => $application->organization_name,
                        'otpCode' => $otpCode,
                        'directorName' => $application->director_name
                    ])->render();

                    $result = $brevoService->sendEmail(
                        $application->email,
                        'Your Organization Application Has Been Approved - DPAR Platform',
                        $htmlContent
                    );

                    if ($result['success']) {
                        Log::info('OTP email sent successfully via Brevo API (Super Admin Override)', [
                            'email' => $application->email,
                            'organization' => $application->organization_name,
                            'messageId' => $result['messageId']
                        ]);
                    } else {
                        Log::error('Failed to send OTP email via Brevo API (Super Admin Override)', [
                            'email' => $application->email,
                            'error' => $result['error']
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to send OTP email (Super Admin Override)', [
                        'email' => $application->email,
                        'error' => $e->getMessage()
                    ]);
                }

                // Log activity for application approval
                ActivityLog::logActivity(
                    Auth::id(),
                    'approve',
                    'Super admin approved application for: ' . $application->organization_name,
                    [
                        'application_id' => $application->id,
                        'organization_name' => $application->organization_name,
                        'director_name' => $application->director_name,
                        'email' => $application->email,
                        'action_by' => 'super_admin'
                    ],
                    null
                );

                Log::info('Super admin overrode application decision', [
                    'superadmin_id' => Auth::id(),
                    'application_id' => $id,
                    'action' => 'approve'
                ]);

                DB::commit();

                return response()->json([
                    'message' => 'Application approved successfully by super admin. OTP sent to user email.',
                    'associate_group' => $associateGroup->load('user'),
                    'recovery_passcodes' => $recoveryPasscodes
                ], 200);
            } else {
                // Reject action
                if ($application->status === 'rejected') {
                    return response()->json(['message' => 'Application is already rejected'], 400);
                }

                $application->update([
                    'status' => 'rejected',
                    'rejection_reason' => $request->reason
                ]);

                // Log activity for application rejection
                ActivityLog::logActivity(
                    Auth::id(),
                    'reject',
                    'Super admin rejected application for: ' . $application->organization_name,
                    [
                        'application_id' => $application->id,
                        'organization_name' => $application->organization_name,
                        'director_name' => $application->director_name,
                        'email' => $application->email,
                        'rejection_reason' => $request->reason,
                        'action_by' => 'super_admin'
                    ],
                    null
                );

                // Send rejection email to user using Brevo API
                try {
                    $brevoService = new BrevoEmailService();

                    // Render the email template
                    $htmlContent = view('emails.application-rejected', [
                        'organizationName' => $application->organization_name,
                        'rejectionReason' => $request->reason ?: 'No reason provided',
                        'directorName' => $application->director_name
                    ])->render();

                    $result = $brevoService->sendEmail(
                        $application->email,
                        'Your Organization Application Has Been Rejected - DPAR Platform',
                        $htmlContent
                    );

                    if ($result['success']) {
                        Log::info('Rejection email sent successfully via Brevo API (Super Admin Override)', [
                            'email' => $application->email,
                            'organization' => $application->organization_name,
                            'messageId' => $result['messageId']
                        ]);
                    } else {
                        Log::error('Failed to send rejection email via Brevo API (Super Admin Override)', [
                            'email' => $application->email,
                            'error' => $result['error']
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to send rejection email (Super Admin Override)', [
                        'email' => $application->email,
                        'error' => $e->getMessage()
                    ]);
                }

                Log::info('Super admin overrode application decision', [
                    'superadmin_id' => Auth::id(),
                    'application_id' => $id,
                    'action' => 'reject'
                ]);

                DB::commit();

                return response()->json(['message' => 'Application rejected by super admin']);
            }
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error overriding application decision: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to override decision', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Permanently delete rejected application
     */
    public function permanentDeleteApplication($id)
    {
        try {
            $application = PendingApplication::findOrFail($id);

            // Only allow deletion of rejected applications
            if ($application->status !== 'rejected') {
                return response()->json([
                    'message' => 'Only rejected applications can be permanently deleted'
                ], 400);
            }

            // Delete logo file if exists
            if ($application->logo && Storage::disk('public')->exists($application->logo)) {
                Storage::disk('public')->delete($application->logo);
            }

            $organizationName = $application->organization_name;
            $application->delete();

            // Log activity for application deletion
            ActivityLog::logActivity(
                Auth::id(),
                'delete',
                'Super admin permanently deleted rejected application: ' . $organizationName,
                [
                    'application_id' => $id,
                    'organization_name' => $organizationName,
                    'director_name' => $application->director_name,
                    'email' => $application->email,
                    'action_by' => 'super_admin'
                ],
                null
            );

            Log::warning('Super admin permanently deleted rejected application', [
                'superadmin_id' => Auth::id(),
                'application_id' => $id,
                'organization_name' => $organizationName
            ]);

            return response()->json(['message' => 'Rejected application permanently deleted']);
        } catch (\Exception $e) {
            Log::error('Error permanently deleting application: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to permanently delete application'], 500);
        }
    }

    /**
     * Generate recovery passcode
     */
    private function generateRecoveryPasscode()
    {
        $uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $lowercase = 'abcdefghijklmnopqrstuvwxyz';
        $numbers = '0123456789';
        $symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        $passcode = '';

        // Ensure at least one character from each category
        $passcode .= $uppercase[random_int(0, strlen($uppercase) - 1)];
        $passcode .= $lowercase[random_int(0, strlen($lowercase) - 1)];
        $passcode .= $numbers[random_int(0, strlen($numbers) - 1)];
        $passcode .= $symbols[random_int(0, strlen($symbols) - 1)];

        // Fill the rest with random characters
        $allChars = $uppercase . $lowercase . $numbers . $symbols;
        for ($i = 4; $i < 10; $i++) { // Recovery passcodes are 10 characters long
            $passcode .= $allChars[random_int(0, strlen($allChars) - 1)];
        }

        return str_shuffle($passcode);
    }

    /**
     * Get head admin activity summary
     */
    public function getHeadAdminActivity($id)
    {
        try {
            $headAdmin = User::where('role', 'head_admin')->whereNull('deleted_at')->findOrFail($id);

            $activity = [
                'total_approvals' => PendingApplication::where('approved_by', $id)->count(),
                'total_rejections' => PendingApplication::where('rejected_by', $id)->count(),
                'total_reports_approved' => Report::where('approved_by', $id)->count(),
                'total_reports_rejected' => Report::where('rejected_by', $id)->count(),
                'total_notifications_sent' => Notification::where('created_by', $id)->count(),
                'total_announcements' => Announcement::where('created_by', $id)->count(),
                'last_activity' => ActivityLog::where('user_id', $id)
                    ->orderBy('created_at', 'desc')
                    ->first()
            ];

            return response()->json($activity);
        } catch (\Exception $e) {
            Log::error('Error fetching head admin activity: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch head admin activity'], 500);
        }
    }

    /**
     * Get database statistics
     */
    public function getDatabaseStats()
    {
        try {
            $stats = [
                'users' => User::count(),
                'associate_groups' => AssociateGroup::count(),
                'pending_applications' => PendingApplication::count(),
                'reports' => Report::count(),
                'notifications' => Notification::count(),
                'announcements' => Announcement::count(),
                'training_programs' => TrainingProgram::count(),
                'evaluations' => Evaluation::count(),
                'activity_logs' => ActivityLog::count(),
                'director_histories' => DirectorHistory::count(),
            ];

            return response()->json($stats);
        } catch (\Exception $e) {
            Log::error('Error fetching database stats: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch database stats'], 500);
        }
    }

    /**
     * Get recent system activities
     */
    public function getRecentActivities()
    {
        try {
            $activities = ActivityLog::with('user')
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get();

            return response()->json($activities);
        } catch (\Exception $e) {
            Log::error('Error fetching recent activities: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch recent activities'], 500);
        }
    }

    /**
     * Get all notifications for super admin
     */
    public function getAllNotifications(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 15);
            $search = $request->get('search');

            // Include soft-deleted notifications so super admin can see and restore them
            $query = Notification::withTrashed()->with(['recipients.user', 'creator']);

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            }

            $notifications = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json($notifications);
        } catch (\Exception $e) {
            Log::error('Error fetching notifications: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch notifications'], 500);
        }
    }

    /**
     * Delete notification (super admin - soft delete)
     */
    public function deleteNotification($id)
    {
        try {
            $notification = Notification::withTrashed()->findOrFail($id);

            if ($notification->trashed()) {
                return response()->json(['message' => 'Notification is already deleted'], 400);
            }

            $notification->delete();

            ActivityLog::logActivity(
                Auth::id(),
                'delete',
                'Super admin deleted notification: ' . $notification->title,
                ['notification_id' => $id, 'notification_title' => $notification->title, 'resource_type' => 'notification'],
                null
            );

            return response()->json(['message' => 'Notification deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Error deleting notification: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to delete notification'], 500);
        }
    }

    /**
     * Permanently delete notification (super admin only)
     */
    public function permanentDeleteNotification($id)
    {
        try {
            $notification = Notification::withTrashed()->findOrFail($id);

            if (!$notification->trashed()) {
                return response()->json(['message' => 'Notification must be soft-deleted before permanent deletion'], 400);
            }

            $notificationTitle = $notification->title;
            $notification->forceDelete();

            ActivityLog::logActivity(
                Auth::id(),
                'delete',
                'Super admin permanently deleted notification: ' . $notificationTitle,
                ['notification_id' => $id, 'notification_title' => $notificationTitle, 'resource_type' => 'notification', 'permanent' => true],
                null
            );

            Log::warning('Super admin permanently deleted notification', [
                'superadmin_id' => Auth::id(),
                'notification_id' => $id,
                'notification_title' => $notificationTitle
            ]);

            return response()->json(['message' => 'Notification permanently deleted']);
        } catch (\Exception $e) {
            Log::error('Error permanently deleting notification: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to permanently delete notification'], 500);
        }
    }

    /**
     * Restore notification (super admin only)
     */
    public function restoreNotification($id)
    {
        try {
            $notification = Notification::withTrashed()->findOrFail($id);

            if (!$notification->trashed()) {
                return response()->json(['message' => 'Notification is not deleted'], 400);
            }

            $notification->restore();

            ActivityLog::logActivity(
                Auth::id(),
                'update',
                'Super admin restored notification: ' . $notification->title,
                ['notification_id' => $id, 'notification_title' => $notification->title, 'resource_type' => 'notification', 'action' => 'restore'],
                null
            );

            return response()->json(['message' => 'Notification restored successfully']);
        } catch (\Exception $e) {
            Log::error('Error restoring notification: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to restore notification'], 500);
        }
    }

    /**
     * Get all announcements for super admin
     */
    public function getAllAnnouncements(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 15);
            $search = $request->get('search');

            // Include soft-deleted announcements so super admin can see and restore them
            $query = Announcement::withTrashed();

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            }

            $announcements = $query->orderBy('created_at', 'desc')->paginate($perPage);

            foreach ($announcements as $a) {
                if ($a->photos && is_array($a->photos)) {
                    $a->photo_urls = array_map(function ($photoPath) {
                        return asset('storage/' . $photoPath);
                    }, $a->photos);
                } else {
                    $a->photo_urls = [];
                }
            }

            return response()->json($announcements);
        } catch (\Exception $e) {
            Log::error('Error fetching announcements: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch announcements'], 500);
        }
    }

    /**
     * Delete announcement (super admin - soft delete)
     */
    public function deleteAnnouncement($id)
    {
        try {
            $announcement = Announcement::withTrashed()->findOrFail($id);

            if ($announcement->trashed()) {
                return response()->json(['message' => 'Announcement is already deleted'], 400);
            }

            $announcement->delete();

            ActivityLog::logActivity(
                Auth::id(),
                'delete',
                'Super admin deleted announcement: ' . $announcement->title,
                ['announcement_id' => $id, 'announcement_title' => $announcement->title, 'resource_type' => 'announcement'],
                null
            );

            return response()->json(['message' => 'Announcement deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Error deleting announcement: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to delete announcement'], 500);
        }
    }

    /**
     * Permanently delete announcement (super admin only)
     */
    public function permanentDeleteAnnouncement($id)
    {
        try {
            $announcement = Announcement::withTrashed()->findOrFail($id);

            if (!$announcement->trashed()) {
                return response()->json(['message' => 'Announcement must be soft-deleted before permanent deletion'], 400);
            }

            $announcementTitle = $announcement->title;

            // Delete associated photos
            if ($announcement->photos && is_array($announcement->photos)) {
                foreach ($announcement->photos as $photoPath) {
                    if (Storage::disk('public')->exists($photoPath)) {
                        Storage::disk('public')->delete($photoPath);
                    }
                }
            }

            $announcement->forceDelete();

            ActivityLog::logActivity(
                Auth::id(),
                'delete',
                'Super admin permanently deleted announcement: ' . $announcementTitle,
                ['announcement_id' => $id, 'announcement_title' => $announcementTitle, 'resource_type' => 'announcement', 'permanent' => true],
                null
            );

            Log::warning('Super admin permanently deleted announcement', [
                'superadmin_id' => Auth::id(),
                'announcement_id' => $id,
                'announcement_title' => $announcementTitle
            ]);

            return response()->json(['message' => 'Announcement permanently deleted']);
        } catch (\Exception $e) {
            Log::error('Error permanently deleting announcement: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to permanently delete announcement'], 500);
        }
    }

    /**
     * Restore announcement (super admin only)
     */
    public function restoreAnnouncement($id)
    {
        try {
            $announcement = Announcement::withTrashed()->findOrFail($id);

            if (!$announcement->trashed()) {
                return response()->json(['message' => 'Announcement is not deleted'], 400);
            }

            $announcement->restore();

            ActivityLog::logActivity(
                Auth::id(),
                'update',
                'Super admin restored announcement: ' . $announcement->title,
                ['announcement_id' => $id, 'announcement_title' => $announcement->title, 'resource_type' => 'announcement', 'action' => 'restore'],
                null
            );

            return response()->json(['message' => 'Announcement restored successfully']);
        } catch (\Exception $e) {
            Log::error('Error restoring announcement: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to restore announcement'], 500);
        }
    }

    /**
     * Get all training programs for super admin
     */
    public function getAllTrainingPrograms(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 15);
            $search = $request->get('search');

            // Include soft-deleted training programs so super admin can see and restore them
            $query = TrainingProgram::withTrashed();

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%");
                });
            }

            $programs = $query->orderBy('created_at', 'desc')->paginate($perPage);

            foreach ($programs as $p) {
                if (!$p->photos) {
                    $p->photos = [];
                } else {
                    $p->photos = array_map(function ($photoPath) {
                        return asset('storage/' . $photoPath);
                    }, $p->photos);
                }
            }

            return response()->json($programs);
        } catch (\Exception $e) {
            Log::error('Error fetching training programs: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch training programs'], 500);
        }
    }

    /**
     * Delete training program (super admin - soft delete)
     */
    public function deleteTrainingProgram($id)
    {
        try {
            $program = TrainingProgram::withTrashed()->findOrFail($id);

            if ($program->trashed()) {
                return response()->json(['message' => 'Training program is already deleted'], 400);
            }

            $programName = $program->name;
            $program->delete();

            // Log activity for training program deletion by super admin
            ActivityLog::logActivity(
                Auth::id(),
                'delete',
                'Super admin deleted training program: ' . $programName,
                [
                    'training_program_id' => $id,
                    'training_program_name' => $programName,
                    'resource_type' => 'training_program',
                    'action_by' => 'super_admin'
                ],
                null
            );

            return response()->json(['message' => 'Training program deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Error deleting training program: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to delete training program'], 500);
        }
    }

    /**
     * Permanently delete training program (super admin only)
     */
    public function permanentDeleteTrainingProgram($id)
    {
        try {
            $program = TrainingProgram::withTrashed()->findOrFail($id);

            if (!$program->trashed()) {
                return response()->json(['message' => 'Training program must be soft-deleted before permanent deletion'], 400);
            }

            $programName = $program->name;

            // Delete associated photos
            if ($program->photos && is_array($program->photos)) {
                foreach ($program->photos as $photoPath) {
                    if (Storage::disk('public')->exists($photoPath)) {
                        Storage::disk('public')->delete($photoPath);
                    }
                }
            }

            $program->forceDelete();

            ActivityLog::logActivity(
                Auth::id(),
                'delete',
                'Super admin permanently deleted training program: ' . $programName,
                [
                    'training_program_id' => $id,
                    'training_program_name' => $programName,
                    'resource_type' => 'training_program',
                    'permanent' => true,
                    'action_by' => 'super_admin'
                ],
                null
            );

            Log::warning('Super admin permanently deleted training program', [
                'superadmin_id' => Auth::id(),
                'training_program_id' => $id,
                'training_program_name' => $programName
            ]);

            return response()->json(['message' => 'Training program permanently deleted']);
        } catch (\Exception $e) {
            Log::error('Error permanently deleting training program: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to permanently delete training program'], 500);
        }
    }

    /**
     * Restore training program (super admin only)
     */
    public function restoreTrainingProgram($id)
    {
        try {
            $program = TrainingProgram::withTrashed()->findOrFail($id);

            if (!$program->trashed()) {
                return response()->json(['message' => 'Training program is not deleted'], 400);
            }

            $program->restore();

            ActivityLog::logActivity(
                Auth::id(),
                'update',
                'Super admin restored training program: ' . $program->name,
                [
                    'training_program_id' => $id,
                    'training_program_name' => $program->name,
                    'resource_type' => 'training_program',
                    'action' => 'restore',
                    'action_by' => 'super_admin'
                ],
                null
            );

            return response()->json(['message' => 'Training program restored successfully']);
        } catch (\Exception $e) {
            Log::error('Error restoring training program: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to restore training program'], 500);
        }
    }

    /**
     * Track citizen page view (public endpoint)
     */
    public function trackCitizenView(Request $request)
    {
        try {
            $request->validate([
                'page_path' => 'required|string',
                'content_type' => 'nullable|string|in:announcement,training_program',
                'content_id' => 'nullable|integer'
            ]);

            CitizenAnalytics::trackView(
                $request->page_path,
                $request->content_type,
                $request->content_id
            );

            return response()->json(['message' => 'View tracked'], 200);
        } catch (\Exception $e) {
            Log::error('Error tracking citizen view: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to track view'], 500);
        }
    }

    /**
     * Cleanup old analytics data (older than specified days)
     */
    public function cleanupOldAnalytics(Request $request)
    {
        try {
            $daysToKeep = $request->input('days_to_keep', 365);
            $cutoffDate = now()->subDays($daysToKeep);
            $deleted = CitizenAnalytics::where('viewed_at', '<', $cutoffDate)->delete();

            Log::info('Super admin cleaned up old citizen analytics', [
                'superadmin_id' => Auth::id(),
                'deleted_count' => $deleted,
                'cutoff_date' => $cutoffDate,
                'days_kept' => $daysToKeep
            ]);

            return response()->json([
                'message' => 'Analytics cleanup completed',
                'deleted_count' => $deleted,
                'days_kept' => $daysToKeep
            ]);
        } catch (\Exception $e) {
            Log::error('Error cleaning up analytics: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to cleanup analytics'], 500);
        }
    }

    /**
     * Get citizen analytics
     */
    public function getCitizenAnalytics(Request $request)
    {
        try {
            $days = $request->get('days', 30);
            $startDate = now()->subDays($days);

            // Page views by path
            $pageViews = CitizenAnalytics::select('page_path', DB::raw('count(*) as views'))
                ->where('viewed_at', '>=', $startDate)
                ->groupBy('page_path')
                ->orderBy('views', 'desc')
                ->get();

            // Content views with titles (paginated)
            $announcementLimit = $request->get('announcement_limit', 20);
            $announcementViews = CitizenAnalytics::select('content_id', DB::raw('count(*) as views'))
                ->where('content_type', 'announcement')
                ->where('viewed_at', '>=', $startDate)
                ->groupBy('content_id')
                ->orderBy('views', 'desc')
                ->limit($announcementLimit)
                ->get()
                ->map(function ($item) {
                    $announcement = Announcement::find($item->content_id);
                    return [
                        'content_id' => $item->content_id,
                        'views' => $item->views,
                        'title' => $announcement ? ($announcement->title ?: 'Untitled Announcement') : 'Deleted Announcement'
                    ];
                });

            $trainingProgramLimit = $request->get('training_limit', 20);
            $trainingProgramViews = CitizenAnalytics::select('content_id', DB::raw('count(*) as views'))
                ->where('content_type', 'training_program')
                ->where('viewed_at', '>=', $startDate)
                ->groupBy('content_id')
                ->orderBy('views', 'desc')
                ->limit($trainingProgramLimit)
                ->get()
                ->map(function ($item) {
                    $program = TrainingProgram::find($item->content_id);
                    return [
                        'content_id' => $item->content_id,
                        'views' => $item->views,
                        'title' => $program ? $program->name : 'Deleted Program'
                    ];
                });

            // Daily views
            $dailyViews = CitizenAnalytics::select(
                DB::raw('DATE(viewed_at) as date'),
                DB::raw('count(*) as views')
            )
                ->where('viewed_at', '>=', $startDate)
                ->groupBy(DB::raw('DATE(viewed_at)'))
                ->orderBy('date', 'asc')
                ->get();

            // Total views
            $totalViews = CitizenAnalytics::where('viewed_at', '>=', $startDate)->count();
            $uniqueVisitors = CitizenAnalytics::where('viewed_at', '>=', $startDate)
                ->distinct('ip_address')
                ->count('ip_address');

            return response()->json([
                'page_views' => $pageViews,
                'announcement_views' => $announcementViews,
                'training_program_views' => $trainingProgramViews,
                'daily_views' => $dailyViews,
                'total_views' => $totalViews,
                'unique_visitors' => $uniqueVisitors,
                'period_days' => $days
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching citizen analytics: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch analytics'], 500);
        }
    }

    /**
     * Toggle announcement visibility
     */
    public function toggleAnnouncementVisibility(Request $request, $id)
    {
        try {
            $announcement = Announcement::findOrFail($id);
            $announcement->visible_to_citizens = $request->input('visible', !$announcement->visible_to_citizens);
            $announcement->save();

            Log::info('Super admin toggled announcement visibility', [
                'superadmin_id' => Auth::id(),
                'announcement_id' => $id,
                'visible' => $announcement->visible_to_citizens
            ]);

            return response()->json([
                'message' => 'Announcement visibility updated',
                'visible_to_citizens' => $announcement->visible_to_citizens
            ]);
        } catch (\Exception $e) {
            Log::error('Error toggling announcement visibility: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update visibility'], 500);
        }
    }

    /**
     * Toggle training program visibility
     */
    public function toggleTrainingProgramVisibility(Request $request, $id)
    {
        try {
            $program = TrainingProgram::findOrFail($id);
            $program->visible_to_citizens = $request->input('visible', !$program->visible_to_citizens);
            $program->save();

            Log::info('Super admin toggled training program visibility', [
                'superadmin_id' => Auth::id(),
                'training_program_id' => $id,
                'visible' => $program->visible_to_citizens
            ]);

            return response()->json([
                'message' => 'Training program visibility updated',
                'visible_to_citizens' => $program->visible_to_citizens
            ]);
        } catch (\Exception $e) {
            Log::error('Error toggling training program visibility: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update visibility'], 500);
        }
    }

    /**
     * Toggle featured status
     */
    public function toggleAnnouncementFeatured(Request $request, $id)
    {
        try {
            $announcement = Announcement::findOrFail($id);
            $newFeaturedStatus = $request->input('featured', !$announcement->featured);
            $announcement->featured = (bool) $newFeaturedStatus;
            $announcement->save();

            ActivityLog::logActivity(
                Auth::id(),
                'update',
                'Super admin ' . ($announcement->featured ? 'featured' : 'unfeatured') . ' announcement: ' . $announcement->title,
                [
                    'announcement_id' => $id,
                    'announcement_title' => $announcement->title,
                    'featured' => $announcement->featured,
                    'resource_type' => 'announcement'
                ],
                null
            );

            return response()->json([
                'message' => 'Announcement featured status updated',
                'featured' => (bool) $announcement->featured
            ]);
        } catch (\Exception $e) {
            Log::error('Error toggling announcement featured: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update featured status'], 500);
        }
    }

    /**
     * Toggle training program featured status
     */
    public function toggleTrainingProgramFeatured(Request $request, $id)
    {
        try {
            $program = TrainingProgram::findOrFail($id);
            $newFeaturedStatus = $request->input('featured', !$program->featured);
            $program->featured = (bool) $newFeaturedStatus; // Ensure boolean casting
            $program->save();

            ActivityLog::logActivity(
                Auth::id(),
                'update',
                'Super admin ' . ($program->featured ? 'featured' : 'unfeatured') . ' training program: ' . $program->name,
                ['training_program_id' => $id, 'training_program_name' => $program->name, 'featured' => $program->featured, 'resource_type' => 'training_program'],
                null
            );
            return response()->json(['message' => 'Training program featured status updated', 'featured' => (bool) $program->featured]);
        } catch (\Exception $e) {
            Log::error('Error updating training program featured status: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update featured status'], 500);
        }
    }

    /**
     * Get system settings
     */
    public function getSystemSettings()
    {
        try {
            $settings = SystemSettings::getAllSettings();

            // Format for frontend
            $formatted = [
                'maintenanceMode' => $settings['maintenance_mode'] ?? false,
                'systemAlerts' => $settings['system_alerts'] ?? true,
                'autoBackup' => $settings['auto_backup'] ?? true,
            ];

            return response()->json($formatted);
        } catch (\Exception $e) {
            Log::error('Error fetching system settings: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch settings'], 500);
        }
    }

    /**
     * Update system settings
     */
    public function updateSystemSettings(Request $request)
    {
        try {
            $request->validate([
                'maintenanceMode' => 'sometimes|boolean',
                'systemAlerts' => 'sometimes|boolean',
                'autoBackup' => 'sometimes|boolean',
            ]);

            $updates = [];

            if ($request->has('maintenanceMode')) {
                SystemSettings::setValue('maintenance_mode', $request->maintenanceMode);
                $updates['maintenance_mode'] = $request->maintenanceMode;

                // Actually enable/disable Laravel maintenance mode
                if ($request->maintenanceMode) {
                    // Enable maintenance mode without secret - superadmin login route is excluded
                    Artisan::call('down');

                    // Manually edit the maintenance file to exclude the superadmin login route
                    $maintenanceFile = storage_path('framework/down');
                    if (file_exists($maintenanceFile)) {
                        $data = json_decode(file_get_contents($maintenanceFile), true);
                        if (!isset($data['except'])) {
                            $data['except'] = [];
                        }
                        // Add routes with leading slash (Laravel checks the full request path)
                        // Exclude all superadmin routes so superadmin can access everything during maintenance
                        $excludedRoutes = [
                            '/api/superadmin/*',
                            '/api/superadmin',
                            '/api/system-alerts/active'
                        ];
                        foreach ($excludedRoutes as $route) {
                            if (!in_array($route, $data['except'])) {
                                $data['except'][] = $route;
                            }
                        }
                        file_put_contents($maintenanceFile, json_encode($data, JSON_PRETTY_PRINT));
                    }
                    Log::info('Maintenance mode enabled by super admin', [
                        'admin_id' => Auth::id()
                    ]);
                } else {
                    Artisan::call('up');
                    Log::info('Maintenance mode disabled by super admin', ['admin_id' => Auth::id()]);
                }
            }

            if ($request->has('systemAlerts')) {
                SystemSettings::setValue('system_alerts', $request->systemAlerts);
                $updates['system_alerts'] = $request->systemAlerts;
            }

            if ($request->has('autoBackup')) {
                SystemSettings::setValue('auto_backup', $request->autoBackup);
                $updates['auto_backup'] = $request->autoBackup;
                // Note: The actual backup cron job should check this setting
                // Use: php artisan db:backup-check (which respects this setting)
            }

            // Log the activity
            ActivityLog::logActivity(
                Auth::id(),
                'update',
                'Super admin updated system settings: ' . implode(', ', array_keys($updates)),
                [
                    'settings_updated' => array_keys($updates),
                    'resource_type' => 'system_settings',
                    'action_by' => 'super_admin'
                ],
                null
            );

            return response()->json([
                'message' => 'Settings updated successfully',
                'settings' => SystemSettings::getAllSettings()
            ]);
        } catch (\RuntimeException $e) {
            Log::error('Error executing maintenance mode command: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update maintenance mode. Please try again.',
                'error' => 'maintenance_command_failed'
            ], 500);
        } catch (\Exception $e) {
            Log::error('Error updating system settings: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to update settings: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all system alerts
     */
    public function getAllSystemAlerts(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 15);
            $search = $request->get('search', '');

            $query = SystemAlert::with(['creator:id,name'])->orderBy('created_at', 'desc');

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('message', 'like', "%{$search}%");
                });
            }

            $alerts = $query->paginate($perPage);

            return response()->json($alerts);
        } catch (\Exception $e) {
            Log::error('Error fetching system alerts: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch alerts'], 500);
        }
    }

    /**
     * Get active system alerts (public endpoint)
     */
    public function getActiveSystemAlerts(Request $request)
    {
        try {
            // Check if system alerts are enabled
            $systemAlertsEnabled = SystemSettings::getValue('system_alerts', true);
            Log::info('System alerts enabled check', [
                'enabled' => $systemAlertsEnabled,
                'setting_value' => SystemSettings::where('key', 'system_alerts')->first()?->value
            ]);

            if (!$systemAlertsEnabled) {
                Log::info('System alerts are disabled in settings');
                return response()->json([
                    'alerts' => [],
                    'debug' => [
                        'system_alerts_enabled' => false,
                        'message' => 'System alerts are disabled in settings'
                    ]
                ]);
            }

            // Get user role (default to 'citizen' for unauthenticated users)
            $userRole = $request->user() ? $request->user()->role : 'citizen';

            // First, check total alerts in database (including inactive/expired)
            $totalAlerts = SystemAlert::count();
            $activeAlertsCount = SystemAlert::active()->count();

            Log::info('Fetching active system alerts', [
                'user_role' => $userRole,
                'authenticated' => $request->user() ? true : false,
                'total_alerts_in_db' => $totalAlerts,
                'active_alerts_before_role_filter' => $activeAlertsCount
            ]);

            // Get all active alerts (before role filtering)
            $activeAlerts = SystemAlert::active()
                ->orderBy('created_at', 'desc')
                ->get();

            Log::info('Active alerts before role filtering', [
                'count' => $activeAlerts->count(),
                'alerts' => $activeAlerts->map(function ($alert) {
                    return [
                        'id' => $alert->id,
                        'title' => $alert->title,
                        'is_active' => $alert->is_active,
                        'show_to_roles' => $alert->show_to_roles,
                        'expires_at' => $alert->expires_at?->toDateTimeString(),
                        'deleted_at' => $alert->deleted_at?->toDateTimeString()
                    ];
                })->toArray()
            ]);

            // Filter by role
            $alerts = $activeAlerts->filter(function ($alert) use ($userRole) {
                $shouldShow = $alert->shouldShowToRole($userRole);
                Log::info('Alert role check', [
                    'alert_id' => $alert->id,
                    'alert_title' => $alert->title,
                    'show_to_roles' => $alert->show_to_roles,
                    'show_to_roles_type' => gettype($alert->show_to_roles),
                    'show_to_roles_is_empty' => empty($alert->show_to_roles),
                    'user_role' => $userRole,
                    'should_show' => $shouldShow
                ]);
                return $shouldShow;
            })->values();

            Log::info('Active system alerts result', [
                'total_alerts' => $alerts->count(),
                'user_role' => $userRole
            ]);

            return response()->json([
                'alerts' => $alerts,
                'debug' => [
                    'system_alerts_enabled' => true,
                    'total_alerts_in_db' => $totalAlerts,
                    'active_alerts_before_role_filter' => $activeAlertsCount,
                    'alerts_after_role_filter' => $alerts->count(),
                    'user_role' => $userRole
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching active system alerts: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'alerts' => [],
                'debug' => [
                    'error' => $e->getMessage()
                ]
            ]);
        }
    }

    /**
     * Create a new system alert
     */
    public function createSystemAlert(Request $request)
    {
        try {
            $request->validate([
                'title' => 'required|string|max:255',
                'message' => 'required|string',
                'type' => 'required|in:info,warning,critical',
                'is_active' => 'sometimes|boolean',
                'show_to_roles' => 'sometimes|nullable|array',
                'show_to_roles.*' => 'in:head_admin,associate_group_leader,citizen',
                'dismissible' => 'sometimes|boolean',
                'send_push_notification' => 'sometimes|boolean',
                'expires_at' => 'sometimes|nullable|date',
            ]);

            // Normalize show_to_roles: empty array or null should be null (show to all)
            $showToRoles = $request->get('show_to_roles', null);
            if (is_array($showToRoles) && empty($showToRoles)) {
                $showToRoles = null;
            }

            $alert = SystemAlert::create([
                'title' => $request->title,
                'message' => $request->message,
                'type' => $request->type,
                'is_active' => $request->get('is_active', true),
                'show_to_roles' => $showToRoles,
                'dismissible' => $request->get('dismissible', true),
                'send_push_notification' => $request->get('send_push_notification', false),
                'expires_at' => $request->expires_at ? now()->parse($request->expires_at) : null,
                'created_by' => Auth::id(),
            ]);

            // Send push notification if requested
            if ($alert->send_push_notification && $alert->is_active) {
                try {
                    $userIds = null;
                    if ($alert->show_to_roles) {
                        // Get user IDs for specific roles (exclude superadmin)
                        $userIds = User::whereIn('role', $alert->show_to_roles)
                            ->where('role', '!=', 'superadmin')
                            ->pluck('id')
                            ->toArray();
                    } else {
                        // If show_to_roles is null (show to all), get all non-superadmin user IDs
                        // This ensures superadmin never receives push notifications
                        $userIds = User::where('role', '!=', 'superadmin')
                            ->pluck('id')
                            ->toArray();
                    }
                    \App\Jobs\SendPushNotificationJob::dispatch(
                        $userIds,
                        $alert->title,
                        $alert->message,
                        ['url' => '/', 'type' => 'system_alert', 'alert_id' => $alert->id]
                    );
                } catch (\Exception $e) {
                    Log::error('Failed to send push notification for system alert: ' . $e->getMessage());
                }
            }

            ActivityLog::logActivity(
                Auth::id(),
                'create',
                'Created system alert: ' . $alert->title,
                [
                    'alert_id' => $alert->id,
                    'alert_title' => $alert->title,
                    'alert_type' => $alert->type,
                    'resource_type' => 'system_alert'
                ],
                null
            );

            return response()->json([
                'message' => 'System alert created successfully',
                'alert' => $alert->load('creator:id,name')
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating system alert: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to create alert'], 500);
        }
    }

    /**
     * Update a system alert
     */
    public function updateSystemAlert(Request $request, $id)
    {
        try {
            $alert = SystemAlert::findOrFail($id);

            $request->validate([
                'title' => 'sometimes|string|max:255',
                'message' => 'sometimes|string',
                'type' => 'sometimes|in:info,warning,critical',
                'is_active' => 'sometimes|boolean',
                'show_to_roles' => 'sometimes|nullable|array',
                'show_to_roles.*' => 'in:head_admin,associate_group_leader,citizen',
                'dismissible' => 'sometimes|boolean',
                'send_push_notification' => 'sometimes|boolean',
                'expires_at' => 'sometimes|nullable|date',
            ]);

            // Normalize show_to_roles: empty array or null should be null (show to all)
            $showToRoles = $alert->show_to_roles;
            if ($request->has('show_to_roles')) {
                $showToRoles = $request->show_to_roles;
                // Normalize: null or empty array means show to all
                if ($showToRoles === null || (is_array($showToRoles) && empty($showToRoles))) {
                    $showToRoles = null;
                }
            }

            $wasActive = $alert->is_active;
            $hadPushEnabled = $alert->send_push_notification;

            $alert->update([
                'title' => $request->get('title', $alert->title),
                'message' => $request->get('message', $alert->message),
                'type' => $request->get('type', $alert->type),
                'is_active' => $request->has('is_active') ? $request->is_active : $alert->is_active,
                'show_to_roles' => $showToRoles,
                'dismissible' => $request->has('dismissible') ? $request->dismissible : $alert->dismissible,
                'send_push_notification' => $request->has('send_push_notification') ? $request->send_push_notification : $alert->send_push_notification,
                'expires_at' => $request->has('expires_at') ? ($request->expires_at ? now()->parse($request->expires_at) : null) : $alert->expires_at,
            ]);

            // Refresh alert to get updated values
            $alert->refresh();

            // Send push notification if:
            // - Alert is now active AND push notification is enabled
            // - AND (it was just activated OR push notification was just enabled)
            $isNowActive = $alert->is_active;
            $hasPushEnabled = $alert->send_push_notification;
            $wasJustActivated = !$wasActive && $isNowActive;
            $pushJustEnabled = !$hadPushEnabled && $hasPushEnabled;

            if ($isNowActive && $hasPushEnabled && ($wasJustActivated || $pushJustEnabled)) {
                try {
                    $userIds = null;
                    if ($alert->show_to_roles) {
                        // Get user IDs for specific roles (exclude superadmin)
                        $userIds = User::whereIn('role', $alert->show_to_roles)
                            ->where('role', '!=', 'superadmin')
                            ->pluck('id')
                            ->toArray();
                    } else {
                        // If show_to_roles is null (show to all), get all non-superadmin user IDs
                        // This ensures superadmin never receives push notifications
                        $userIds = User::where('role', '!=', 'superadmin')
                            ->pluck('id')
                            ->toArray();
                    }
                    \App\Jobs\SendPushNotificationJob::dispatch(
                        $userIds,
                        $alert->title,
                        $alert->message,
                        ['url' => '/', 'type' => 'system_alert', 'alert_id' => $alert->id]
                    );
                } catch (\Exception $e) {
                    Log::error('Failed to send push notification for system alert update: ' . $e->getMessage());
                }
            }

            ActivityLog::logActivity(
                Auth::id(),
                'update',
                'Updated system alert: ' . $alert->title,
                [
                    'alert_id' => $alert->id,
                    'alert_title' => $alert->title,
                    'resource_type' => 'system_alert'
                ],
                null
            );

            return response()->json([
                'message' => 'System alert updated successfully',
                'alert' => $alert->load('creator:id,name')
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating system alert: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update alert'], 500);
        }
    }

    /**
     * Delete a system alert (soft delete)
     */
    public function deleteSystemAlert($id)
    {
        try {
            $alert = SystemAlert::findOrFail($id);
            $alertTitle = $alert->title;
            $alert->delete();

            ActivityLog::logActivity(
                Auth::id(),
                'delete',
                'Deleted system alert: ' . $alertTitle,
                [
                    'alert_id' => $id,
                    'alert_title' => $alertTitle,
                    'resource_type' => 'system_alert'
                ],
                null
            );

            return response()->json(['message' => 'System alert deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Error deleting system alert: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to delete alert'], 500);
        }
    }

    /**
     * Restore a deleted system alert
     */
    public function restoreSystemAlert($id)
    {
        try {
            $alert = SystemAlert::withTrashed()->findOrFail($id);
            $alert->restore();

            ActivityLog::logActivity(
                Auth::id(),
                'update',
                'Restored system alert: ' . $alert->title,
                [
                    'alert_id' => $alert->id,
                    'alert_title' => $alert->title,
                    'resource_type' => 'system_alert'
                ],
                null
            );

            return response()->json([
                'message' => 'System alert restored successfully',
                'alert' => $alert->load('creator:id,name')
            ]);
        } catch (\Exception $e) {
            Log::error('Error restoring system alert: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to restore alert'], 500);
        }
    }

    /**
     * Permanently delete a system alert
     */
    public function permanentDeleteSystemAlert($id)
    {
        try {
            $alert = SystemAlert::withTrashed()->findOrFail($id);
            $alertTitle = $alert->title;
            $alert->forceDelete();

            ActivityLog::logActivity(
                Auth::id(),
                'delete',
                'Permanently deleted system alert: ' . $alertTitle,
                [
                    'alert_id' => $id,
                    'alert_title' => $alertTitle,
                    'resource_type' => 'system_alert'
                ],
                null
            );

            return response()->json(['message' => 'System alert permanently deleted']);
        } catch (\Exception $e) {
            Log::error('Error permanently deleting system alert: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to permanently delete alert'], 500);
        }
    }
}
