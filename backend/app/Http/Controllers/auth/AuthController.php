<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    // Login user
    public function login(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|string|email|max:255|exists:users,email',
                'password' => 'required|string',
            ]);

            $user = User::where('email', $request['email'])->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    'message' => 'Invalid credentials.',
                    'errors' => ['email' => ['Invalid credentials.']]
                ], 401);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            // Log login activity for associates
            if ($user->role === 'associate_group_leader') {
                ActivityLog::logActivity(
                    $user->id,
                    'login',
                    'User logged in successfully',
                    ['ip_address' => $request->ip(), 'user_agent' => $request->userAgent()]
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

            $token = $user->createToken('auth_token')->plainTextToken;

            // Log login activity for associates
            if ($user->role === 'associate_group_leader') {
                ActivityLog::logActivity(
                    $user->id,
                    'login',
                    'User logged in with recovery passcode',
                    ['ip_address' => $request->ip(), 'user_agent' => $request->userAgent(), 'method' => 'recovery_passcode']
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
}
