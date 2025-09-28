<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use App\Services\BrevoEmailService;
use App\Models\ActivityLog;
use App\Models\DirectorHistory;

class PasswordController extends Controller
{
    public function changePassword(Request $request)
    {
        try {
            Log::info('Change password request received', [
                'user_id' => Auth::id(),
                'has_user' => Auth::check(),
                'request_data' => $request->only(['current_password', 'new_password', 'new_password_confirmation'])
            ]);

            $request->validate([
                'current_password' => 'required',
                'new_password' => 'required|min:8',
                'new_password_confirmation' => 'required|same:new_password',
            ]);

            $user = Auth::user();

            if (!$user) {
                Log::error('User not authenticated in changePassword');
                return response()->json(['message' => 'User not authenticated'], 401);
            }

            Log::info('User authenticated', [
                'user_id' => $user->id,
                'email' => $user->email,
                'has_recovery_passcodes' => !empty($user->recovery_passcodes)
            ]);

            /** @var \App\Models\User $user */

            // Check if current_password is actually a recovery passcode
            $isRecoveryPasscode = false;
            if (strlen($request->current_password) <= 10) {
                // Check if it's a recovery passcode
                try {
                    // recovery_passcodes is already cast to array by Laravel
                    $recoveryPasscodes = $user->recovery_passcodes ?? [];
                    Log::info('Recovery passcodes check', [
                        'recovery_passcodes' => $recoveryPasscodes,
                        'current_password' => $request->current_password,
                        'is_array' => is_array($recoveryPasscodes)
                    ]);

                    if (is_array($recoveryPasscodes) && in_array($request->current_password, $recoveryPasscodes)) {
                        $isRecoveryPasscode = true;
                        Log::info('Recovery passcode validated successfully');
                    }
                } catch (\Exception $e) {
                    Log::error('Error checking recovery passcodes: ' . $e->getMessage());
                    $recoveryPasscodes = [];
                }
            }

            // If not a recovery passcode, verify it's the current password
            if (!$isRecoveryPasscode && !Hash::check($request->current_password, $user->password)) {
                Log::warning('Password verification failed', ['is_recovery' => $isRecoveryPasscode]);
                return response()->json(['message' => 'Current password or recovery passcode is incorrect'], 422);
            }

            Log::info('Password verification successful', ['is_recovery' => $isRecoveryPasscode]);

            // Update the password
            $user->update([
                'password' => Hash::make($request->new_password)
            ]);

            // If recovery passcode was used, remove it from the list to prevent reuse
            if ($isRecoveryPasscode) {
                try {
                    // Log the current recovery passcodes before removal
                    Log::info('Recovery passcodes before removal', [
                        'user_id' => $user->id,
                        'current_passcodes' => $recoveryPasscodes,
                        'used_passcode' => $request->current_password
                    ]);

                    // Remove only the specific passcode that was used
                    $recoveryPasscodes = array_filter($recoveryPasscodes, function ($code) use ($request) {
                        return $code !== $request->current_password;
                    });

                    // Re-index the array to maintain proper JSON structure
                    $recoveryPasscodes = array_values($recoveryPasscodes);

                    // Log the recovery passcodes after removal
                    Log::info('Recovery passcodes after removal', [
                        'user_id' => $user->id,
                        'remaining_passcodes' => $recoveryPasscodes,
                        'count' => count($recoveryPasscodes)
                    ]);

                    $user->update([
                        'recovery_passcodes' => $recoveryPasscodes // Laravel will auto-convert array to JSON
                    ]);
                    Log::info('Recovery passcode removed successfully');
                } catch (\Exception $e) {
                    Log::error('Error updating recovery passcodes: ' . $e->getMessage());
                    // Continue even if recovery passcode cleanup fails
                }
            }

            Log::info('Password changed successfully');
            return response()->json(['message' => 'Password changed successfully']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Validation failed in changePassword', ['errors' => $e->errors()]);
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Password change error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'An error occurred while changing password'], 500);
        }
    }

    public function adminChangePassword(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'new_password' => 'required|min:8',
            'new_password_confirmation' => 'required|same:new_password',
        ]);

        $user = User::findOrFail($request->user_id);

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json(['message' => 'Password changed successfully']);
    }

    /**
     * Get user's recovery passcodes
     */
    public function getRecoveryPasscodes(Request $request)
    {
        try {
            $user = Auth::user();
            $recoveryPasscodes = $user->recovery_passcodes ?? [];

            return response()->json([
                'recovery_passcodes' => $recoveryPasscodes,
                'count' => count($recoveryPasscodes)
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting recovery passcodes: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to get recovery passcodes'], 500);
        }
    }

    /**
     * Send OTP for passcode regeneration
     */
    public function sendOtpForPasscodeRegen(Request $request)
    {
        try {
            $user = Auth::user();

            // Generate 6-digit OTP
            $otpCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            // Store OTP in cache with 10-minute expiration
            cache()->put('passcode_regen_otp_' . $user->id, $otpCode, 600);

            // Send OTP via email
            $brevoService = new BrevoEmailService();
            $brevoService->sendOtpEmail($user->email, $otpCode, 'Recovery Passcode Regeneration');

            // Log activity
            ActivityLog::logActivity(
                $user->id,
                'passcode_regen_otp_sent',
                'OTP sent for recovery passcode regeneration',
                ['email' => $user->email],
                DirectorHistory::getCurrentDirectorHistoryId($user->id)
            );

            return response()->json(['message' => 'OTP sent to your email']);
        } catch (\Exception $e) {
            Log::error('Error sending OTP for passcode regen: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to send OTP'], 500);
        }
    }

    /**
     * Regenerate recovery passcodes after OTP verification
     */
    public function regeneratePasscodes(Request $request)
    {
        try {
            $request->validate([
                'otp_code' => 'required|string|size:6'
            ]);

            $user = Auth::user();

            if (!$user) {
                return response()->json(['message' => 'User not authenticated'], 401);
            }

            // Verify OTP
            $storedOtp = cache()->get('passcode_regen_otp_' . $user->id);
            if (!$storedOtp || $storedOtp !== $request->otp_code) {
                return response()->json(['message' => 'Invalid or expired OTP code'], 422);
            }

            // Clear OTP from cache
            cache()->forget('passcode_regen_otp_' . $user->id);

            // Generate 5 new recovery passcodes
            $newPasscodes = [];
            for ($i = 0; $i < 5; $i++) {
                $newPasscodes[] = $this->generateRecoveryPasscode();
            }

            // Update user with new passcodes
            User::where('id', $user->id)->update(['recovery_passcodes' => $newPasscodes]);

            // Create passcodes content for download
            $passcodesContent = "DPAR Platform - Recovery Passcodes\n";
            $passcodesContent .= "=====================================\n\n";
            $passcodesContent .= "Organization: " . $user->organization . "\n";
            $passcodesContent .= "Director: " . $user->name . "\n\n";
            $passcodesContent .= "Your Recovery Passcodes (use these if you forget your password):\n\n";
            foreach ($newPasscodes as $index => $passcode) {
                $passcodesContent .= ($index + 1) . ". " . $passcode . "\n";
            }
            $passcodesContent .= "\nImportant Notes:\n";
            $passcodesContent .= "- Each passcode can only be used once\n";
            $passcodesContent .= "- Keep these passcodes secure and do not share them\n";
            $passcodesContent .= "- If you use all five passcodes, you can generate new ones\n\n";
            $passcodesContent .= "Generated on: " . now()->format('Y-m-d H:i:s') . "\n";

            // Log activity
            ActivityLog::logActivity(
                $user->id,
                'passcode_regen_success',
                'Recovery passcodes regenerated successfully',
                ['passcode_count' => count($newPasscodes)],
                DirectorHistory::getCurrentDirectorHistoryId($user->id)
            );

            return response()->json([
                'message' => 'Recovery passcodes generated successfully',
                'passcodes_content' => $passcodesContent
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error regenerating passcodes: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to regenerate passcodes'], 500);
        }
    }

    /**
     * Generate a recovery passcode
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
}
