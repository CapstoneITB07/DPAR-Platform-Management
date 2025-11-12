<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\ActivityLog;
use App\Models\DirectorHistory;
use App\Models\PendingApplication;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use App\Services\BrevoEmailService;

class AuthController extends Controller
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

    // Check if organization name is available
    public function checkOrganizationName(Request $request)
    {
        try {
            $request->validate([
                'organization_name' => 'required|string|max:255'
            ]);

            $organizationName = $request->organization_name;

            // Check in pending applications (case-insensitive) - only check non-rejected
            $pendingExists = PendingApplication::whereRaw('LOWER(organization_name) = ?', [strtolower($organizationName)])
                ->where('status', '!=', 'rejected')
                ->exists();

            // Check in approved users (case-insensitive)
            $approvedExists = User::whereRaw('LOWER(organization) = ?', [strtolower($organizationName)])
                ->exists();

            $isAvailable = !$approvedExists;

            return response()->json([
                'available' => $isAvailable,
                'message' => $isAvailable ? 'Organization name is qualified' : 'This organization name is already registered.'
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Organization name check error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while checking organization name.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Send recovery verification code to user's email (by username)
    public function sendRecoveryCode(Request $request)
    {
        try {
            $request->validate([
                'username' => ['required', 'string', 'max:30', 'min:3'],
            ]);

            $user = User::where('username', $request->username)->first();

            // Respond with generic message to avoid user enumeration
            if (!$user) {
                return response()->json([
                    'message' => 'If the account exists, a verification code has been sent.'
                ], 200);
            }

            // Enforce 1-minute cooldown between sends
            $cooldownKey = 'recovery_email_cooldown_user_' . $user->id;
            $cooldownUntil = Cache::get($cooldownKey);
            if ($cooldownUntil && now()->lt($cooldownUntil)) {
                $remaining = now()->diffInSeconds($cooldownUntil);
                return response()->json([
                    'message' => 'Please wait before requesting another code.',
                    'cooldown_remaining' => $remaining
                ], 429);
            }

            // Generate a 6-digit code and cache it for 1 minute (60 seconds)
            $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $cacheKey = 'recovery_email_code_user_' . $user->id;
            Cache::put($cacheKey, $code, now()->addSeconds(60));

            // Email the code using styled template
            try {
                $brevo = new BrevoEmailService();
                // Custom styled email noting 1-minute expiry
                $subject = 'DPAR Platform - Account Recovery Code';
                $htmlContent = "<!DOCTYPE html>\n<html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>Account Recovery Code</title></head>
                <body style='margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;'>
                  <div style='max-width:600px;margin:0 auto;background:#ffffff;padding:20px;'>
                    <div style='text-align:center;margin-bottom:24px;'>
                      <h1 style='color:#A11C22;margin:0;font-size:26px;'>DPAR Platform</h1>
                      <p style='color:#666;margin:6px 0 0 0;font-size:14px;'>Account Recovery</p>
                    </div>
                    <div style='background:#f8f9fa;padding:20px;border-radius:8px;margin-bottom:18px;'>
                      <p style='color:#444;margin:0 0 12px 0;'>Use this verification code to recover your account:</p>
                      <div style='background:#A11C22;color:#fff;padding:14px;border-radius:6px;text-align:center;font-size:24px;font-weight:bold;letter-spacing:3px;margin:14px 0;'>" . e($code) . "</div>
                      <p style='color:#666;margin:8px 0 0 0;font-size:13px;'>This code will expire in <strong>1 minute</strong>. Do not share this code with anyone.</p>
                    </div>
                    <div style='text-align:center;color:#666;font-size:12px;margin-top:26px;'>
                      <p style='margin:0;'>If you did not request this code, you can ignore this email.</p>
                      <p style='margin:8px 0 0 0;'>&copy; " . date('Y') . " DPAR Platform. All rights reserved.</p>
                    </div>
                  </div>
                </body></html>";
                $brevo->sendEmail($user->email, $subject, $htmlContent);
            } catch (\Exception $e) {
                Log::error('Failed to send recovery code email: ' . $e->getMessage());
                return response()->json(['message' => 'Failed to send verification code. Try again later.'], 500);
            }

            // Return masked email
            $masked = $this->maskEmail($user->email);

            // Set cooldown for 60 seconds
            $cooldownDuration = 60;
            Cache::put($cooldownKey, now()->addSeconds($cooldownDuration), now()->addSeconds($cooldownDuration));
            return response()->json([
                'message' => 'If the account exists, a verification code has been sent.',
                'masked_email' => $masked,
                'cooldown_remaining' => $cooldownDuration
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }
    }

    // Verify recovery code and issue temporary session to change password
    public function verifyRecoveryCode(Request $request)
    {
        try {
            $request->validate([
                'username' => ['required', 'string', 'max:30', 'min:3'],
                'code' => 'required|string|size:6'
            ]);

            $user = User::where('username', $request->username)->first();
            if (!$user) {
                return response()->json(['message' => 'Invalid code or user.'], 401);
            }

            $cacheKey = 'recovery_email_code_user_' . $user->id;
            $stored = Cache::get($cacheKey);
            if (!$stored || $stored !== $request->code) {
                return response()->json(['message' => 'Invalid or expired verification code.'], 401);
            }

            // Revoke existing tokens and create a new one
            $user->tokens()->delete();
            $token = $user->createToken('auth_token', ['*'], now()->addMinutes(30))->plainTextToken; // short-lived

            // Let change-password accept this code as the current_password once
            Cache::put('recovery_email_code_accepted_' . $user->id, $stored, now()->addMinutes(15));

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'organization' => $user->organization
                ],
                'token' => $token,
                'message' => 'Verification successful. Please change your password now.'
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Verify recovery code error: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred during verification.'], 500);
        }
    }

    private function maskEmail(string $email): string
    {
        [$local, $domain] = explode('@', $email, 2);
        $localMasked = strlen($local) <= 2 ? substr($local, 0, 1) . '*' : substr($local, 0, 2) . str_repeat('*', max(1, strlen($local) - 3)) . substr($local, -1);
        $domainParts = explode('.', $domain);
        $domainName = $domainParts[0] ?? '';
        $domainTld = implode('.', array_slice($domainParts, 1));
        $domainMasked = (strlen($domainName) <= 2)
            ? substr($domainName, 0, 1) . '*'
            : substr($domainName, 0, 1) . str_repeat('*', max(1, strlen($domainName) - 2)) . substr($domainName, -1);
        return $localMasked . '@' . $domainMasked . ($domainTld ? ('.' . $domainTld) : '');
    }

    // Check if director name is available
    public function checkDirectorName(Request $request)
    {
        try {
            $request->validate([
                'director_name' => 'required|string|max:255'
            ]);

            $directorName = $request->director_name;

            // Check in pending applications (case-insensitive) - only check non-rejected
            $pendingExists = PendingApplication::whereRaw('LOWER(director_name) = ?', [strtolower($directorName)])
                ->where('status', '!=', 'rejected')
                ->exists();

            // Check in approved users (case-insensitive)
            $approvedExists = User::whereRaw('LOWER(name) = ?', [strtolower($directorName)])
                ->exists();

            $isAvailable = !$approvedExists;

            // Log for debugging
            Log::info('Director name check', [
                'director_name' => $directorName,
                'pending_exists' => $pendingExists,
                'approved_exists' => $approvedExists,
                'is_available' => $isAvailable
            ]);

            return response()->json([
                'available' => $isAvailable,
                'message' => $isAvailable ? 'Director name is qualified' : 'This director name is already registered.'
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Director name check error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while checking director name.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Check if email is available
    public function checkEmail(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|string|email|max:255'
            ]);

            $email = $request->email;

            // Check in pending applications (case-insensitive) - only check non-rejected
            $pendingExists = PendingApplication::whereRaw('LOWER(email) = ?', [strtolower($email)])
                ->where('status', '!=', 'rejected')
                ->exists();

            // Check in approved users (case-insensitive)
            $approvedExists = User::whereRaw('LOWER(email) = ?', [strtolower($email)])
                ->exists();

            $isAvailable = !$approvedExists;

            // Log for debugging
            Log::info('Email check', [
                'email' => $email,
                'pending_exists' => $pendingExists,
                'approved_exists' => $approvedExists,
                'is_available' => $isAvailable
            ]);

            return response()->json([
                'available' => $isAvailable,
                'message' => $isAvailable ? 'Email address is qualified' : 'This email is already registered.'
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Email check error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while checking email.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Check if username is available
    public function checkUsername(Request $request)
    {
        try {
            $request->validate([
                'username' => ['required', 'string', 'max:30', 'min:3']
            ]);

            $username = $request->username;

            // Validate username format, TLD patterns, and reserved words
            $validation = $this->validateUsername($username);
            if (!$validation['valid']) {
                return response()->json([
                    'available' => false,
                    'message' => $validation['message']
                ], 422);
            }

            $pendingExists = PendingApplication::whereRaw('LOWER(username) = ?', [strtolower($username)])
                ->where('status', '!=', 'rejected')
                ->exists();

            $approvedExists = User::whereRaw('LOWER(username) = ?', [strtolower($username)])
                ->exists();

            $isAvailable = !$approvedExists && !$pendingExists;

            return response()->json([
                'available' => $isAvailable,
                'message' => $isAvailable ? 'Username is available' : 'This username is already taken.'
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Username check error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while checking username.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Register new associate application
    public function register(Request $request)
    {
        try {
            $request->validate([
                'organization_name' => 'required|string|max:255',
                'organization_type' => 'required|string|max:255',
                'director_name' => 'required|string|max:255',
                'username' => ['required', 'string', 'max:30', 'min:3', 'unique:users,username'],
                'email' => 'required|string|email|max:255|unique:users,email',
                'phone' => ['required', 'string', 'size:11', 'regex:/^09[0-9]{9}$/'],
                'password' => 'required|string|min:8|confirmed',
                'description' => 'required|string|min:20',
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            ], [
                'organization_name.required' => 'Organization name is required.',
                'organization_type.required' => 'Organization type is required.',
                'director_name.required' => 'Director name is required.',
                'username.required' => 'Username is required.',
                'username.unique' => 'This username is already taken.',
                'email.required' => 'Email address is required.',
                'email.email' => 'Please enter a valid email address.',
                'email.unique' => 'This email is already registered.',
                'phone.required' => 'Phone number is required.',
                'phone.size' => 'Phone number must be exactly 11 digits.',
                'phone.regex' => 'Phone number must start with 09 and contain only numbers.',
                'password.required' => 'Password is required.',
                'password.min' => 'Password must be at least 8 characters long.',
                'password.confirmed' => 'Password confirmation does not match.',
                'description.required' => 'Organization description is required.',
                'description.min' => 'Description must be at least 20 characters.',
                'logo.required' => 'Organization logo is required.',
                'logo.image' => 'Logo must be a valid image file.',
                'logo.mimes' => 'Logo must be in JPEG, PNG, JPG, or GIF format.',
                'logo.max' => 'Logo file size must not exceed 2MB.',
            ]);

            // Check for duplicates in pending applications (excluding rejected)
            $existingPending = PendingApplication::where('email', $request->email)
                ->where('status', '!=', 'rejected')
                ->first();

            if ($existingPending) {
                return response()->json([
                    'message' => 'This email is already registered.',
                    'errors' => ['email' => ['This email is already registered.']]
                ], 422);
            }

            // Validate username format, TLD patterns, and reserved words
            $usernameValidation = $this->validateUsername($request->username);
            if (!$usernameValidation['valid']) {
                return response()->json([
                    'message' => $usernameValidation['message'],
                    'errors' => ['username' => [$usernameValidation['message']]]
                ], 422);
            }

            // Ensure username is unique across users and pending applications
            $usernameTaken = User::where('username', $request->username)->exists() ||
                PendingApplication::where('username', $request->username)->where('status', '!=', 'rejected')->exists();
            if ($usernameTaken) {
                return response()->json([
                    'message' => 'This username is already taken.',
                    'errors' => ['username' => ['This username is already taken.']]
                ], 422);
            }

            // Handle logo upload
            $logoPath = null;
            if ($request->hasFile('logo')) {
                $logoPath = $request->file('logo')->store('pending_logos', 'public');
            }

            // Create pending application
            $application = PendingApplication::create([
                'organization_name' => $request->organization_name,
                'organization_type' => $request->organization_type,
                'director_name' => $request->director_name,
                'username' => $request->username,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'description' => $request->description,
                'logo' => $logoPath,
                'status' => 'pending'
            ]);

            // Send push notification to admin about new application
            try {
                \App\Services\PushNotificationService::notifyAdminNewApplication($application);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to send new application push notification: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Application submitted successfully. Please wait for admin approval.',
                'application_id' => $application->id
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Registration error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred during registration.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Login user (using username instead of email)
    public function login(Request $request)
    {
        try {
            $request->validate([
                'username' => ['required', 'string', 'max:30', 'min:3'],
                'password' => 'required|string',
            ]);

            // Check for soft-deleted users - exclude them from login
            $user = User::where('username', $request['username'])
                ->whereNull('deleted_at')
                ->first();

            // Additional safety check: if user is soft-deleted, block login
            if ($user && $user->trashed()) {
                return response()->json([
                    'message' => 'Invalid credentials.',
                    'errors' => ['username' => ['Invalid credentials.']]
                ], 401);
            }

            if (!$user) {
                // Check if there's a pending application with this username
                $pendingApplication = PendingApplication::where('username', $request['username'])
                    ->where('status', 'pending')
                    ->first();

                if ($pendingApplication) {
                    return response()->json([
                        'message' => 'Your application is still under review. Please wait for admin approval.',
                        'requires_otp' => true,
                        'application_status' => 'pending'
                    ], 200);
                }

                return response()->json([
                    'message' => 'Invalid credentials.',
                    'errors' => ['username' => ['Invalid credentials.']]
                ], 401);
            }

            // Enhanced security: Check for account lockout and progressive delays
            $this->checkAccountSecurity($user, $request);

            // Check if the user's associate group has been soft deleted BEFORE password validation
            if ($user->role === 'associate_group_leader') {
                // Use withTrashed() to include soft-deleted records and check if it's trashed
                $associateGroup = \App\Models\AssociateGroup::withTrashed()
                    ->where('user_id', $user->id)
                    ->first();

                // Debug logging
                Log::info('Soft delete check for user', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'associate_group_found' => $associateGroup ? true : false,
                    'associate_group_deleted_at' => $associateGroup ? $associateGroup->deleted_at : null,
                    'is_trashed' => $associateGroup ? $associateGroup->trashed() : false
                ]);

                if ($associateGroup && $associateGroup->trashed()) {
                    // Revoke all existing tokens for this user
                    $user->tokens()->delete();

                    Log::info('Blocking login for soft-deleted associate', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'associate_group_id' => $associateGroup->id,
                        'deleted_at' => $associateGroup->deleted_at
                    ]);

                    return response()->json([
                        'message' => 'Invalid account. Contact the administrator.',
                        'error' => 'Invalid account'
                    ], 403);
                }
            }

            // Now check password
            if (!Hash::check($request->password, $user->password)) {
                // Record failed login attempt with enhanced security
                $this->recordFailedLoginAttempt($user, $request);
                return response()->json([
                    'message' => 'Invalid credentials.',
                    'errors' => ['username' => ['Invalid credentials.']]
                ], 401);
            }

            // Block superadmin logins through regular login endpoint for security
            // Return generic error to prevent revealing superadmin login page exists
            if ($user->role === 'superadmin') {
                return response()->json([
                    'message' => 'Invalid credentials.',
                    'errors' => ['username' => ['Invalid credentials.']]
                ], 401);
            }

            // Clear failed attempts on successful login
            $this->clearFailedAttempts($user, $request);

            // Check if user needs OTP verification (first-time login after approval or email change)
            if ($user->needs_otp_verification) {
                $reason = '';
                if ($user->role === 'associate_group_leader') {
                    // Check if it's first-time login or email change
                    if ($user->email_verification_otp) {
                        $reason = 'email change verification';
                    } else {
                        $reason = 'first-time login after approval';
                    }
                } elseif ($user->role === 'head_admin' && $user->email_verification_otp) {
                    $reason = 'email change verification';
                }

                if ($reason) {
                    Log::info('User requires OTP verification', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'role' => $user->role,
                        'reason' => $reason,
                        'needs_otp_verification' => $user->needs_otp_verification
                    ]);
                    return response()->json([
                        'message' => 'OTP verification required. Please check your email for the authentication code.',
                        'requires_otp' => true,
                        'user_id' => $user->id
                    ], 200);
                }
            }

            // Log successful login for debugging
            Log::info('User login successful', [
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'needs_otp_verification' => $user->needs_otp_verification
            ]);

            // Revoke all existing tokens for this user (industry standard for security)
            $user->tokens()->delete();

            // Create token with 7-day expiration
            $token = $user->createToken('auth_token', ['*'], now()->addDays(7))->plainTextToken;

            // Log login activity for associates and head admins
            // Note: Superadmin logins are excluded from system logs view, so we don't log them here
            if (in_array($user->role, ['associate_group_leader', 'head_admin'])) {
                $directorHistoryId = null;
                if ($user->role === 'associate_group_leader') {
                    $directorHistoryId = DirectorHistory::getCurrentDirectorHistoryId($user->id);
                }
                ActivityLog::logActivity(
                    $user->id,
                    'login',
                    'User logged in successfully',
                    ['ip_address' => $request->ip(), 'user_agent' => $request->userAgent()],
                    $directorHistoryId
                );
            }

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'organization' => $user->organization
                ],
                'token' => $token
            ], 200)->header('Access-Control-Allow-Credentials', 'true');
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Login error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred during login.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Superadmin login - separate endpoint for security
    public function superadminLogin(Request $request)
    {
        try {
            // Ensure maintenance file has correct route exclusion (in case maintenance was enabled manually)
            // The route is excluded from maintenance mode, so superadmin can always login to disable maintenance
            $this->ensureMaintenanceRouteExclusion();

            $request->validate([
                'username' => ['required', 'string', 'max:30', 'min:3'],
                'password' => 'required|string',
            ]);

            // Check for soft-deleted users - exclude them from login
            $user = User::where('username', $request['username'])
                ->whereNull('deleted_at')
                ->first();

            // Additional safety check: if user is soft-deleted, block login
            if ($user && $user->trashed()) {
                return response()->json([
                    'message' => 'Invalid credentials.',
                    'errors' => ['username' => ['Invalid credentials.']]
                ], 401);
            }

            if (!$user) {
                return response()->json([
                    'message' => 'Invalid credentials.',
                    'errors' => ['username' => ['Invalid credentials.']]
                ], 401);
            }

            // Only allow superadmin role through this endpoint
            if ($user->role !== 'superadmin') {
                return response()->json([
                    'message' => 'Invalid credentials.',
                    'errors' => ['username' => ['Invalid credentials.']]
                ], 401);
            }

            // Enhanced security: Check for account lockout and progressive delays
            $this->checkAccountSecurity($user, $request);

            // Now check password
            if (!Hash::check($request->password, $user->password)) {
                // Record failed login attempt with enhanced security
                $this->recordFailedLoginAttempt($user, $request);
                return response()->json([
                    'message' => 'Invalid credentials.',
                    'errors' => ['username' => ['Invalid credentials.']]
                ], 401);
            }

            // Clear failed attempts on successful login
            $this->clearFailedAttempts($user, $request);

            // Log successful login for debugging
            Log::info('Superadmin login successful', [
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role
            ]);

            // Revoke all existing tokens for this user (industry standard for security)
            $user->tokens()->delete();

            // Create token with 7-day expiration
            $token = $user->createToken('auth_token', ['*'], now()->addDays(7))->plainTextToken;

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'organization' => $user->organization
                ],
                'token' => $token
            ], 200)->header('Access-Control-Allow-Credentials', 'true');
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Superadmin login error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred during login.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Logout user
    public function logout(Request $request)
    {
        try {
            $user = $request->user();

            // Log logout activity before deleting tokens
            if ($user) {
                $directorHistoryId = null;
                if ($user->role === 'associate_group_leader') {
                    $directorHistoryId = DirectorHistory::getCurrentDirectorHistoryId($user->id);
                }
                ActivityLog::logActivity(
                    $user->id,
                    'logout',
                    'User logged out successfully',
                    ['ip_address' => $request->ip(), 'user_agent' => $request->userAgent()],
                    $directorHistoryId
                );
            }

            $user->tokens()->delete();
            return response()->json(['message' => 'Logged out successfully'], 200);
        } catch (\Exception $e) {
            Log::error('Logout error: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred during logout.'], 500);
        }
    }

    // Login with recovery passcode (using username)
    public function loginWithRecoveryPasscode(Request $request)
    {
        try {
            $request->validate([
                'username' => 'required|string|min:3|max:30|exists:users,username',
                'recovery_passcode' => 'required|string|min:10|max:10',
            ]);

            $user = User::where('username', $request->username)->first();

            if (!$user) {
                return response()->json([
                    'message' => 'User not found.',
                    'errors' => ['username' => ['User not found.']]
                ], 404);
            }

            // Check if the user's associate group has been soft deleted
            if ($user->role === 'associate_group_leader') {
                $associateGroup = \App\Models\AssociateGroup::withTrashed()
                    ->where('user_id', $user->id)
                    ->first();

                if ($associateGroup && $associateGroup->trashed()) {
                    // Revoke all existing tokens for this user
                    $user->tokens()->delete();

                    return response()->json([
                        'message' => 'Invalid account. Contact the administrator.',
                        'error' => 'Invalid account'
                    ], 403);
                }
            }

            // Check if user is temporarily locked out due to too many failed attempts
            $lockoutKey = 'recovery_passcode_lockout_' . $user->id;
            $lockoutUntil = cache()->get($lockoutKey);

            if ($lockoutUntil && now()->lt($lockoutUntil)) {
                $remainingMinutes = now()->diffInMinutes($lockoutUntil, false);
                return response()->json([
                    'message' => "Account temporarily locked due to too many failed recovery attempts. Please try again in {$remainingMinutes} minutes.",
                    'errors' => ['recovery_passcode' => ['Account temporarily locked.']]
                ], 429);
            }

            // Check if the recovery passcode matches any of the user's recovery passcodes
            $recoveryPasscodes = $user->recovery_passcodes ?? [];

            if (!in_array($request->recovery_passcode, $recoveryPasscodes)) {
                // Increment failed attempt counter
                $attemptKey = 'recovery_passcode_attempts_' . $user->id;
                $failedAttempts = cache()->get($attemptKey, 0) + 1;
                cache()->put($attemptKey, $failedAttempts, now()->addMinutes(30));

                // Log the failed attempt
                Log::warning('Failed recovery passcode attempt', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'attempt_number' => $failedAttempts,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent()
                ]);

                // Check if we should lock the account
                if ($failedAttempts >= 5) {
                    $lockoutDuration = 30; // Lock for 30 minutes
                    cache()->put($lockoutKey, now()->addMinutes($lockoutDuration), now()->addMinutes($lockoutDuration));

                    // Clear the attempt counter
                    cache()->forget($attemptKey);

                    return response()->json([
                        'message' => "Too many failed recovery attempts. Account locked for {$lockoutDuration} minutes.",
                        'errors' => ['recovery_passcode' => ['Account locked due to too many failed attempts.']]
                    ], 429);
                }

                // Return error with remaining attempts info
                $remainingAttempts = 5 - $failedAttempts;
                return response()->json([
                    'message' => "Invalid recovery passcode. {$remainingAttempts} attempts remaining before account lockout.",
                    'errors' => ['recovery_passcode' => ['Invalid recovery passcode.']],
                    'remaining_attempts' => $remainingAttempts
                ], 401);
            }

            // Success! Clear any failed attempt counters
            cache()->forget('recovery_passcode_attempts_' . $user->id);
            cache()->forget('recovery_passcode_lockout_' . $user->id);

            // Log successful recovery login
            Log::info('Successful recovery passcode login', [
                'user_id' => $user->id,
                'email' => $user->email,
                'ip_address' => $request->ip()
            ]);

            // Don't remove the recovery passcode yet - it will be consumed when the password is changed
            // This allows the user to use the same passcode in the change password modal

            // Revoke all existing tokens for this user (industry standard for security)
            $user->tokens()->delete();

            // Create token with 7-day expiration
            $token = $user->createToken('auth_token', ['*'], now()->addDays(7))->plainTextToken;

            // Log login activity for associates and head admins
            // Note: Superadmin logins are excluded from system logs view, so we don't log them here
            if (in_array($user->role, ['associate_group_leader', 'head_admin'])) {
                $directorHistoryId = null;
                if ($user->role === 'associate_group_leader') {
                    $directorHistoryId = DirectorHistory::getCurrentDirectorHistoryId($user->id);
                }
                ActivityLog::logActivity(
                    $user->id,
                    'login',
                    'User logged in with recovery passcode',
                    ['ip_address' => $request->ip(), 'user_agent' => $request->userAgent(), 'method' => 'recovery_passcode'],
                    $directorHistoryId
                );
            }

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'organization' => $user->organization
                ],
                'token' => $token,
                'message' => 'Login successful with recovery passcode. Please change your password now.'
            ], 200)->header('Access-Control-Allow-Credentials', 'true');
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Recovery passcode login error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred during recovery passcode login.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Check recovery passcode lockout status (for admins)
    public function checkRecoveryLockoutStatus(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|string|email|max:255|exists:users,email',
            ]);

            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return response()->json(['message' => 'User not found.'], 404);
            }

            $lockoutKey = 'recovery_passcode_lockout_' . $user->id;
            $attemptKey = 'recovery_passcode_attempts_' . $user->id;

            $lockoutUntil = cache()->get($lockoutKey);
            $failedAttempts = cache()->get($attemptKey, 0);

            $isLocked = $lockoutUntil && now()->lt($lockoutUntil);
            $remainingLockoutTime = $isLocked ? now()->diffInMinutes($lockoutUntil, false) : 0;
            $remainingAttempts = 5 - $failedAttempts;

            return response()->json([
                'user_id' => $user->id,
                'email' => $user->email,
                'is_locked' => $isLocked,
                'failed_attempts' => $failedAttempts,
                'remaining_attempts' => max(0, $remainingAttempts),
                'lockout_until' => $lockoutUntil ? $lockoutUntil->toISOString() : null,
                'remaining_lockout_minutes' => $remainingLockoutTime
            ]);
        } catch (\Exception $e) {
            Log::error('Check recovery lockout status error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while checking lockout status.'
            ], 500);
        }
    }

    // Manually unlock account (for admins)
    public function unlockRecoveryAccount(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|string|email|max:255|exists:users,email',
            ]);

            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return response()->json(['message' => 'User not found.'], 404);
            }

            $lockoutKey = 'recovery_passcode_lockout_' . $user->id;
            $attemptKey = 'recovery_passcode_attempts_' . $user->id;

            // Clear lockout and attempt counters
            cache()->forget($lockoutKey);
            cache()->forget($attemptKey);

            Log::info('Recovery account manually unlocked by admin', [
                'user_id' => $user->id,
                'email' => $user->email,
                'admin_id' => Auth::id()
            ]);

            return response()->json([
                'message' => 'Account unlocked successfully.',
                'user_id' => $user->id,
                'email' => $user->email
            ]);
        } catch (\Exception $e) {
            Log::error('Unlock recovery account error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while unlocking account.'
            ], 500);
        }
    }

    // Verify OTP for first-time login
    public function verifyOtp(Request $request)
    {
        try {
            $request->validate([
                'user_id' => 'required|integer|exists:users,id',
                'otp_code' => 'required|string|size:6',
            ]);

            $user = User::findOrFail($request->user_id);

            // Block superadmin OTP verification through regular endpoint for security
            if ($user->role === 'superadmin') {
                return response()->json([
                    'message' => 'Invalid or expired OTP code.',
                    'errors' => ['otp_code' => ['Invalid or expired OTP code.']]
                ], 401);
            }

            // Check if the user's associate group has been soft deleted
            if ($user->role === 'associate_group_leader') {
                $associateGroup = \App\Models\AssociateGroup::withTrashed()
                    ->where('user_id', $user->id)
                    ->first();

                if ($associateGroup && $associateGroup->trashed()) {
                    // Revoke all existing tokens for this user
                    $user->tokens()->delete();

                    return response()->json([
                        'message' => 'Invalid account. Contact the administrator.',
                        'errors' => ['user_id' => ['Invalid account.']]
                    ], 403);
                }
            }

            // Generate device identifier from IP and User-Agent
            $deviceId = md5($request->ip() . $request->userAgent());

            // Check attempt counter with device identifier
            $attemptKey = 'otp_attempts_' . $user->id . '_' . $deviceId;
            $lockoutKey = 'otp_lockout_' . $user->id . '_' . $deviceId;
            $attempts = cache()->get($attemptKey, 0);
            $maxAttempts = 5;

            if ($attempts >= $maxAttempts) {
                $lockoutTime = cache()->get($lockoutKey);

                if ($lockoutTime && $lockoutTime > now()) {
                    $remainingTime = $lockoutTime->diffInSeconds(now());
                    return response()->json([
                        'message' => "Too many failed attempts. Please wait {$remainingTime} seconds before trying again.",
                        'errors' => ['otp_code' => ['Too many failed attempts. Please wait before trying again.']],
                        'attempts_remaining' => 0,
                        'lockout_remaining' => $remainingTime
                    ], 429);
                } else {
                    // Reset attempts if lockout period has passed
                    cache()->forget($attemptKey);
                    cache()->forget($lockoutKey);
                    $attempts = 0;
                }
            }

            // Check if user has a pending application with matching OTP (for associates)
            $pendingApplication = null;
            if ($user->role === 'associate_group_leader') {
                $pendingApplication = PendingApplication::where('email', $user->email)
                    ->where('status', 'approved')
                    ->where('otp_code', $request->otp_code)
                    ->where('otp_expires_at', '>', now())
                    ->first();
            }

            // Check if user has email verification OTP (for head admin or associate)
            $emailVerificationOtpValid = false;
            if (($user->role === 'head_admin' || $user->role === 'associate_group_leader') && $user->email_verification_otp) {
                if (
                    $user->email_verification_otp === $request->otp_code &&
                    $user->email_verification_otp_expires_at &&
                    $user->email_verification_otp_expires_at > now()
                ) {
                    $emailVerificationOtpValid = true;
                }
            }

            // If neither OTP is valid, return error
            if (!$pendingApplication && !$emailVerificationOtpValid) {
                // Increment attempt counter
                $attempts++;
                cache()->put($attemptKey, $attempts, 300); // Store for 5 minutes

                $attemptsRemaining = $maxAttempts - $attempts;

                if ($attempts >= $maxAttempts) {
                    // Set lockout for 1 minute
                    cache()->put($lockoutKey, now()->addMinutes(1), 60);
                    return response()->json([
                        'message' => 'Too many failed attempts. Please wait 60 seconds before trying again.',
                        'errors' => ['otp_code' => ['Too many failed attempts. Please wait before trying again.']],
                        'attempts_remaining' => 0,
                        'lockout_remaining' => 60
                    ], 429);
                }

                return response()->json([
                    'message' => 'Invalid or expired OTP code.',
                    'errors' => ['otp_code' => ['Invalid or expired OTP code.']],
                    'attempts_remaining' => $attemptsRemaining
                ], 401);
            }

            // Clear the OTP and mark user as verified
            if ($pendingApplication) {
                $pendingApplication->update([
                    'otp_code' => null,
                    'otp_expires_at' => null
                ]);
            }

            if ($emailVerificationOtpValid) {
                $user->update([
                    'email_verification_otp' => null,
                    'email_verification_otp_expires_at' => null
                ]);
            }

            $user->update(['needs_otp_verification' => false]);
            // Clear attempt counter on successful verification
            cache()->forget($attemptKey);
            cache()->forget($lockoutKey);

            // Revoke all existing tokens for this user (industry standard for security)
            $user->tokens()->delete();

            // Create token with 7-day expiration
            $token = $user->createToken('auth_token', ['*'], now()->addDays(7))->plainTextToken;

            // Log login activity for associates and head admins
            // Note: Superadmin logins are excluded from system logs view, so we don't log them here
            if (in_array($user->role, ['associate_group_leader', 'head_admin'])) {
                $directorHistoryId = null;
                if ($user->role === 'associate_group_leader') {
                    $directorHistoryId = DirectorHistory::getCurrentDirectorHistoryId($user->id);
                }
                ActivityLog::logActivity(
                    $user->id,
                    'login',
                    'User logged in successfully with OTP verification',
                    ['ip_address' => $request->ip(), 'user_agent' => $request->userAgent(), 'method' => 'otp_verification'],
                    $directorHistoryId
                );
            }

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'organization' => $user->organization
                ],
                'token' => $token,
                'message' => 'OTP verified successfully. Welcome to the system!'
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('OTP verification error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred during OTP verification.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Enhanced security: Check account lockout and progressive delays
     */
    private function checkAccountSecurity($user, $request)
    {
        $ipAddress = $request->ip();
        $userAgent = $request->userAgent();
        $deviceId = md5($ipAddress . $userAgent);

        // Check for account lockout
        $lockoutKey = 'account_lockout_' . $user->id;
        $lockoutUntil = cache()->get($lockoutKey);

        if ($lockoutUntil && now()->lt($lockoutUntil)) {
            $remainingMinutes = now()->diffInMinutes($lockoutUntil, false);
            throw new \Exception("Account temporarily locked due to too many failed login attempts. Please try again in {$remainingMinutes} minutes.");
        }

        // Check for progressive delays (disabled for better UX)
        // Note: Progressive delays are disabled to allow users to retry login attempts
        // The route-level throttling (5 attempts in 10 minutes) provides sufficient protection

        // Monitor suspicious IP patterns
        $this->monitorSuspiciousActivity($user, $request);
    }

    /**
     * Record failed login attempt with enhanced security
     */
    private function recordFailedLoginAttempt($user, $request)
    {
        $ipAddress = $request->ip();
        $userAgent = $request->userAgent();
        $deviceId = md5($ipAddress . $userAgent);

        // Increment failed attempts
        $attemptKey = 'login_attempts_' . $user->id . '_' . $deviceId;
        $attempts = cache()->get($attemptKey, 0) + 1;
        cache()->put($attemptKey, $attempts, now()->addHours(24)); // Store for 24 hours

        // Progressive delay disabled for better UX
        // Users can retry immediately, protected by route-level throttling
        $delayMinutes = 0; // No delay since progressive delay is disabled

        // Log suspicious activity
        Log::warning('Failed login attempt', [
            'user_id' => $user->id,
            'email' => $user->email,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'attempt_number' => $attempts,
            'delay_minutes' => $delayMinutes
        ]);

        // Check for account lockout (5 attempts = 30 minute lockout - industry standard)
        if ($attempts >= 5) {
            $lockoutKey = 'account_lockout_' . $user->id;
            $lockoutDuration = 30; // 30 minutes (industry standard per OWASP/PCI DSS)
            cache()->put($lockoutKey, now()->addMinutes($lockoutDuration), now()->addMinutes($lockoutDuration));

            Log::critical('Account locked due to repeated failed login attempts', [
                'user_id' => $user->id,
                'email' => $user->email,
                'ip_address' => $ipAddress,
                'attempts' => $attempts,
                'lockout_duration' => $lockoutDuration
            ]);
        }

        // Monitor for suspicious patterns
        $this->monitorSuspiciousActivity($user, $request);
    }

    /**
     * Clear failed attempts on successful login
     */
    private function clearFailedAttempts($user, $request)
    {
        $ipAddress = $request->ip();
        $userAgent = $request->userAgent();
        $deviceId = md5($ipAddress . $userAgent);

        $attemptKey = 'login_attempts_' . $user->id . '_' . $deviceId;
        $delayKey = 'login_delay_' . $user->id . '_' . $deviceId;
        $lockoutKey = 'account_lockout_' . $user->id;

        cache()->forget($attemptKey);
        cache()->forget($delayKey);
        cache()->forget($lockoutKey);
    }

    /**
     * Ensure the maintenance file has the correct route exclusion
     * This is called on every superadmin login attempt to ensure the route is always excluded
     */
    private function ensureMaintenanceRouteExclusion()
    {
        $maintenanceFile = storage_path('framework/down');
        if (file_exists($maintenanceFile)) {
            try {
                $data = json_decode(file_get_contents($maintenanceFile), true);
                if ($data && is_array($data)) {
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
                    $updated = false;
                    foreach ($excludedRoutes as $route) {
                        if (!in_array($route, $data['except'])) {
                            $data['except'][] = $route;
                            $updated = true;
                        }
                    }
                    if ($updated) {
                        file_put_contents($maintenanceFile, json_encode($data, JSON_PRETTY_PRINT));
                        Log::info('Updated maintenance file to include superadmin login route exclusion');
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Failed to update maintenance file', ['error' => $e->getMessage()]);
            }
        }
    }

    /**
     * Monitor suspicious activity patterns
     */
    private function monitorSuspiciousActivity($user, $request)
    {
        $ipAddress = $request->ip();
        $userAgent = $request->userAgent();

        // Track IPs attempting the same account
        $ipTrackingKey = 'suspicious_ips_' . $user->id;
        $suspiciousIps = cache()->get($ipTrackingKey, []);

        if (!in_array($ipAddress, $suspiciousIps)) {
            $suspiciousIps[] = $ipAddress;
            cache()->put($ipTrackingKey, $suspiciousIps, now()->addDays(7)); // Store for 7 days
        }

        // Alert if multiple IPs are attempting the same account
        if (count($suspiciousIps) > 3) {
            Log::critical('Multiple IPs attempting same account', [
                'user_id' => $user->id,
                'email' => $user->email,
                'suspicious_ips' => $suspiciousIps,
                'current_ip' => $ipAddress,
                'user_agent' => $userAgent
            ]);
        }

        // Track rapid login attempts from same IP
        $rapidAttemptsKey = 'rapid_attempts_' . $ipAddress;
        $rapidAttempts = cache()->get($rapidAttemptsKey, 0) + 1;
        cache()->put($rapidAttemptsKey, $rapidAttempts, now()->addMinutes(5));

        if ($rapidAttempts > 10) { // More than 10 attempts in 5 minutes
            Log::warning('Rapid login attempts detected', [
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
                'attempts' => $rapidAttempts,
                'target_email' => $user->email
            ]);
        }
    }
}
