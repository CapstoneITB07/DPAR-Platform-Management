<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Models\AssociateGroup;
use App\Models\DirectorHistory;
use App\Models\Volunteer;
use App\Models\ActivityLog;
use App\Services\BrevoEmailService;
use Illuminate\Support\Facades\Log;

class ProfileController extends Controller
{
    public function getProfile()
    {
        $user = Auth::user();
        $associateGroup = AssociateGroup::where('user_id', $user->id)->first();

        return response()->json([
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'organization' => $associateGroup ? $associateGroup->name : $user->organization,
            'director' => $associateGroup ? $associateGroup->director : null,
            'type' => $associateGroup ? $associateGroup->type : null,
            'logo' => $associateGroup ? $associateGroup->logo : null,
            'profile_picture_url' => $user->profile_picture ? asset('storage/' . $user->profile_picture) : null,
        ]);
    }

    public function updatePicture(Request $request)
    {
        $request->validate([
            'profile_picture' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        try {
            $user = Auth::user();
            /** @var \App\Models\User $user */

            if ($request->hasFile('profile_picture')) {
                // Delete old profile picture if exists
                if ($user->profile_picture && Storage::exists('public/' . $user->profile_picture)) {
                    Storage::delete('public/' . $user->profile_picture);
                }

                // Store new profile picture
                $path = $request->file('profile_picture')->store('profile_pictures', 'public');
                $user->profile_picture = $path;
                $user->save();

                // If user is an associate group leader, also update the associate group logo
                $associateGroup = AssociateGroup::where('user_id', $user->id)->first();
                if ($associateGroup) {
                    // Delete old logo if exists
                    if ($associateGroup->logo && Storage::exists('public/' . $associateGroup->logo)) {
                        Storage::delete('public/' . $associateGroup->logo);
                    }
                    $associateGroup->logo = $path;
                    $associateGroup->save();
                }

                // Log activity for profile picture update
                try {
                    ActivityLog::logActivity(
                        $user->id,
                        'profile_updated',
                        'Updated profile picture',
                        [
                            'update_type' => 'profile_picture',
                            'user_id' => $user->id,
                            'user_name' => $user->name,
                            'associate_group_id' => $associateGroup ? $associateGroup->id : null,
                            'associate_group_name' => $associateGroup ? $associateGroup->name : null
                        ],
                        null
                    );
                } catch (\Exception $e) {
                    Log::error('Failed to log profile picture update activity: ' . $e->getMessage());
                }

                return response()->json([
                    'message' => 'Profile picture updated successfully',
                    'profile_picture_url' => asset('storage/' . $path)
                ]);
            }

            return response()->json(['message' => 'No file uploaded'], 400);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update profile picture: ' . $e->getMessage()], 500);
        }
    }

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
            if (preg_match('/\.' . preg_quote($tld, '/') . '$/i', $lowerUsername) || 
                preg_match('/\.' . preg_quote($tld, '/') . '[^a-z0-9]/i', $lowerUsername)) {
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

    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:30|min:3|unique:users,username,' . Auth::id(),
            'email' => 'required|email|unique:users,email,' . Auth::id(),
            'director' => 'nullable|string|max:255',
            'type' => 'nullable|string|max:255',
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ], [
            'username.unique' => 'This username is already taken.'
        ]);

        // Validate username format, TLD patterns, and reserved words
        $usernameValidation = $this->validateUsername($request->username);
        if (!$usernameValidation['valid']) {
            return response()->json([
                'message' => $usernameValidation['message'],
                'errors' => ['username' => [$usernameValidation['message']]]
            ], 422);
        }

        DB::beginTransaction();
        try {
            $user = Auth::user();
            /** @var \App\Models\User $user */

            // Store original values for comparison
            $originalName = $user->name;
            $originalEmail = $user->email;
            $originalUsername = $user->username;

            $user->name = $request->name;
            $user->username = $request->username;
            
            // Check if email is being changed
            $emailChanged = false;
            if ($request->email !== $originalEmail) {
                $emailChanged = true;
                $newEmail = $request->email;

                // Generate OTP code
                $otpCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
                $otpExpiresAt = now()->addHours(24); // OTP expires in 24 hours

                // Store OTP in user data
                $user->email = $newEmail;
                $user->email_verification_otp = $otpCode;
                $user->email_verification_otp_expires_at = $otpExpiresAt;
                $user->needs_otp_verification = true;

                // Revoke all existing tokens to force re-login with OTP
                $user->tokens()->delete();

                // Send OTP email to new email address
                try {
                    $brevoService = new BrevoEmailService();
                    $result = $brevoService->sendOtpEmail($newEmail, $otpCode, 'Email Verification');

                    if ($result['success']) {
                        Log::info('Email verification OTP sent to user', [
                            'user_id' => $user->id,
                            'role' => $user->role,
                            'old_email' => $originalEmail,
                            'new_email' => $newEmail,
                            'messageId' => $result['messageId'] ?? null
                        ]);
                    } else {
                        Log::error('Failed to send email verification OTP to user', [
                            'user_id' => $user->id,
                            'role' => $user->role,
                            'new_email' => $newEmail,
                            'error' => $result['error'] ?? 'Unknown error'
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Exception sending OTP to user', [
                        'user_id' => $user->id,
                        'role' => $user->role,
                        'new_email' => $newEmail,
                        'error' => $e->getMessage()
                    ]);
                }
            } else {
                $user->email = $request->email;
            }

            // Handle profile image upload
            if ($request->hasFile('profile_image')) {
                // Delete old profile picture if exists
                if ($user->profile_picture && Storage::exists('public/' . $user->profile_picture)) {
                    Storage::delete('public/' . $user->profile_picture);
                }

                // Store new profile picture
                $path = $request->file('profile_image')->store('profile_pictures', 'public');
                $user->profile_picture = $path;
            }

            $user->save();

            // If user is an associate group leader, handle director changes
            $associateGroup = AssociateGroup::where('user_id', $user->id)->first();
            $directorChanged = false;
            if ($associateGroup) {
                // Check if director name or email changed (indicating a director change)
                $originalDirector = $associateGroup->director;
                $originalDirectorName = $associateGroup->director; // Use stored director name from associate group

                if ($request->has('director') && $request->director !== $originalDirector) {
                    $directorChanged = true;
                }

                // If director changed, create director history for the previous director
                if ($directorChanged && $originalDirector) {
                    // Get the current director history record
                    $currentDirectorHistory = DirectorHistory::where('associate_group_id', $associateGroup->id)
                        ->where('is_current', true)
                        ->first();

                    if ($currentDirectorHistory) {
                        // Update the current record to mark it as former director with end date
                        $currentDirectorHistory->update([
                            'is_current' => false,
                            'end_date' => now()->subDay()->toDateString(), // Set end date to yesterday so activities are properly separated
                            'director_name' => $originalDirectorName, // Ensure we use the original name
                            'director_email' => $originalEmail
                        ]);

                        // Get activity summary for previous director
                        $activitySummary = $this->getDirectorActivitySummary($user->id);

                        // Get the actual volunteer count for the associate group during the previous director's tenure
                        $previousDirectorVolunteerCount = Volunteer::where('associate_group_id', $associateGroup->id)
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

                    // Create director history entry for new director (only if it's a real change)
                    $existingCurrentHistory = DirectorHistory::where('associate_group_id', $associateGroup->id)
                        ->where('director_email', $request->email)
                        ->where('is_current', true)
                        ->first();

                    if (!$existingCurrentHistory) {
                        // Create director history entry for new director with reset counts
                        DirectorHistory::create([
                            'associate_group_id' => $associateGroup->id,
                            'director_name' => $request->director,
                            'director_email' => $request->email,
                            'contributions' => 'New director - ' . $request->director,
                            'volunteers_recruited' => 0, // Start with 0 volunteers for new director
                            'reports_submitted' => 0,
                            'notifications_responded' => 0,
                            'logins' => 0,
                            'start_date' => now()->toDateString(), // New director starts today
                            'is_current' => true
                        ]);
                    }
                }

                // Update the associate group name and director (type cannot be changed)
                $associateGroup->name = $request->name;
                if ($request->has('director')) {
                    $associateGroup->director = $request->director; // Store actual director name
                }

                // Update associate group logo if profile image was uploaded
                if ($request->hasFile('profile_image')) {
                    // Delete old logo if exists
                    if ($associateGroup->logo && Storage::exists('public/' . $associateGroup->logo)) {
                        Storage::delete('public/' . $associateGroup->logo);
                    }
                    $associateGroup->logo = $user->profile_picture; // Use the same path as user profile picture
                }

                // Organization type is not allowed to be changed by associates
                $associateGroup->save();
            }

            DB::commit();

            // Track what was changed for logging
            $changes = [];
            if ($originalName !== $user->name) $changes[] = 'name';
            if ($originalEmail !== $user->email) $changes[] = 'email';
            if ($originalUsername !== $user->username) $changes[] = 'username';
            if ($request->hasFile('profile_image')) $changes[] = 'profile_picture';
            if ($directorChanged) {
                $changes[] = 'director';
            }

            // Log activity for profile update
            if (!empty($changes)) {
                try {
                    ActivityLog::logActivity(
                        $user->id,
                        'profile_updated',
                        'Updated profile: ' . implode(', ', $changes),
                        [
                            'update_type' => 'profile_info',
                            'user_id' => $user->id,
                            'user_name' => $user->name,
                            'changes' => $changes,
                            'associate_group_id' => $associateGroup ? $associateGroup->id : null,
                            'associate_group_name' => $associateGroup ? $associateGroup->name : null,
                            'director_changed' => $associateGroup && in_array('director', $changes)
                        ],
                        null
                    );
                } catch (\Exception $e) {
                    Log::error('Failed to log profile update activity: ' . $e->getMessage());
                }
            }

            $message = 'Profile updated successfully';
            if ($emailChanged) {
                $message .= '. An OTP has been sent to your new email address. Please verify the email before logging in again.';
            }

            return response()->json([
                'message' => $message,
                'profile_picture_url' => $user->profile_picture ? asset('storage/' . $user->profile_picture) : null,
                'email_changed' => $emailChanged
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update profile: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get director activity summary for the previous director's tenure
     */
    private function getDirectorActivitySummary($userId)
    {
        $user = \App\Models\User::find($userId);
        if (!$user) {
            return [
                'contributions_summary' => 'No activity data available',
                'volunteers_recruited' => 0,
                'notifications_created' => 0,
                'reports_submitted' => 0,
                'total_activities' => 0
            ];
        }

        // Get the associate group to find the director history
        $associateGroup = \App\Models\AssociateGroup::where('user_id', $userId)->first();
        if (!$associateGroup) {
            return [
                'contributions_summary' => 'No associate group found',
                'volunteers_recruited' => 0,
                'notifications_created' => 0,
                'reports_submitted' => 0,
                'total_activities' => 0
            ];
        }

        // Get the current director history to get the tenure period
        $currentDirectorHistory = \App\Models\DirectorHistory::where('associate_group_id', $associateGroup->id)
            ->where('is_current', true)
            ->first();

        if (!$currentDirectorHistory) {
            // If no current director history, count all activities
            $notificationsCount = $user->notifications()->count();
            $reportsCount = $user->reports()->count();
            $activitiesCount = $user->activityLogs()->count();
            $volunteersCount = $user->volunteers()->count();
        } else {
            // Count activities from the start of current director's tenure to now
            $startDate = $currentDirectorHistory->start_date;

            $notificationsCount = $user->notifications()
                ->where('created_at', '>=', $startDate)
                ->count();
            $reportsCount = $user->reports()
                ->where('created_at', '>=', $startDate)
                ->count();
            $activitiesCount = $user->activityLogs()
                ->where('activity_at', '>=', $startDate)
                ->count();
            // Volunteers should NOT be reset - count all volunteers regardless of date
            $volunteersCount = $user->volunteers()->count();
        }

        $contributions = [];
        if ($notificationsCount > 0) $contributions[] = "Created {$notificationsCount} notifications";
        if ($reportsCount > 0) $contributions[] = "Submitted {$reportsCount} reports";
        if ($activitiesCount > 0) $contributions[] = "Performed {$activitiesCount} system activities";
        if ($volunteersCount > 0) $contributions[] = "Recruited {$volunteersCount} volunteers";

        return [
            'contributions_summary' => empty($contributions) ? 'No significant activities recorded' : implode(', ', $contributions),
            'volunteers_recruited' => $volunteersCount,
            'notifications_created' => $notificationsCount,
            'reports_submitted' => $reportsCount,
            'total_activities' => $activitiesCount
        ];
    }
}
