<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

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

            // Check if the recovery passcode matches any of the user's recovery passcodes
            $recoveryPasscodes = $user->recovery_passcodes ?? [];

            if (!in_array($request->recovery_passcode, $recoveryPasscodes)) {
                return response()->json([
                    'message' => 'Invalid recovery passcode.',
                    'errors' => ['recovery_passcode' => ['Invalid recovery passcode.']]
                ], 401);
            }

            // Remove the used recovery passcode
            $updatedPasscodes = array_values(array_filter($recoveryPasscodes, function ($passcode) use ($request) {
                return $passcode !== $request->recovery_passcode;
            }));

            $user->update(['recovery_passcodes' => $updatedPasscodes]);

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'organization' => $user->organization
                ],
                'token' => $token,
                'message' => 'Login successful with recovery passcode. Please change your password soon.'
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
}
