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

class AuthController extends Controller
{
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

    // Register new associate application
    public function register(Request $request)
    {
        try {
            $request->validate([
                'organization_name' => 'required|string|max:255',
                'organization_type' => 'required|string|max:255',
                'director_name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email',
                'phone' => ['required', 'string', 'size:11', 'regex:/^09[0-9]{9}$/'],
                'password' => 'required|string|min:8|confirmed',
                'description' => 'required|string|min:20',
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            ], [
                'organization_name.required' => 'Organization name is required.',
                'organization_type.required' => 'Organization type is required.',
                'director_name.required' => 'Director name is required.',
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

    // Login user
    public function login(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|string|email|max:255',
                'password' => 'required|string',
            ]);

            $user = User::where('email', $request['email'])->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                // Check if there's a pending application with this email
                $pendingApplication = PendingApplication::where('email', $request['email'])
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
                    'errors' => ['email' => ['Invalid credentials.']]
                ], 401);
            }

            // Check if user needs OTP verification (first-time login after approval)
            if ($user->role === 'associate_group_leader' && $user->needs_otp_verification) {
                Log::info('User requires OTP verification', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'needs_otp_verification' => $user->needs_otp_verification
                ]);
                return response()->json([
                    'message' => 'OTP verification required. Please check your email for the authentication code.',
                    'requires_otp' => true,
                    'user_id' => $user->id
                ], 200);
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

            // Log login activity for associates
            if ($user->role === 'associate_group_leader') {
                $directorHistoryId = DirectorHistory::getCurrentDirectorHistoryId($user->id);
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

    // Logout user
    public function logout(Request $request)
    {
        try {
            $request->user()->tokens()->delete();
            return response()->json(['message' => 'Logged out successfully'], 200);
        } catch (\Exception $e) {
            Log::error('Logout error: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred during logout.'], 500);
        }
    }

    // Login with recovery passcode
    public function loginWithRecoveryPasscode(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|string|email|max:255|exists:users,email',
                'recovery_passcode' => 'required|string|min:10|max:10',
            ]);

            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return response()->json([
                    'message' => 'User not found.',
                    'errors' => ['email' => ['User not found.']]
                ], 404);
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

            // Log login activity for associates
            if ($user->role === 'associate_group_leader') {
                $directorHistoryId = DirectorHistory::getCurrentDirectorHistoryId($user->id);
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

            // Check if user has a pending application with matching OTP
            $pendingApplication = PendingApplication::where('email', $user->email)
                ->where('status', 'approved')
                ->where('otp_code', $request->otp_code)
                ->where('otp_expires_at', '>', now())
                ->first();

            if (!$pendingApplication) {
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
            $pendingApplication->update([
                'otp_code' => null,
                'otp_expires_at' => null
            ]);

            $user->update(['needs_otp_verification' => false]);
            // Clear attempt counter on successful verification
            cache()->forget($attemptKey);
            cache()->forget($lockoutKey);

            // Revoke all existing tokens for this user (industry standard for security)
            $user->tokens()->delete();

            // Create token with 7-day expiration
            $token = $user->createToken('auth_token', ['*'], now()->addDays(7))->plainTextToken;

            // Log login activity
            $directorHistoryId = DirectorHistory::getCurrentDirectorHistoryId($user->id);
            ActivityLog::logActivity(
                $user->id,
                'login',
                'User logged in successfully with OTP verification',
                ['ip_address' => $request->ip(), 'user_agent' => $request->userAgent(), 'method' => 'otp_verification'],
                $directorHistoryId
            );

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
}
