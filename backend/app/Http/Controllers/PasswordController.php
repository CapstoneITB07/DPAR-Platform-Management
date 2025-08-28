<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

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
                    $recoveryPasscodes = array_filter($recoveryPasscodes, function ($code) use ($request) {
                        return $code !== $request->current_password;
                    });
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
}
