<?php

namespace App\Http\Controllers;

use App\Models\PendingApplication;
use App\Models\User;
use App\Models\AssociateGroup;
use App\Models\DirectorHistory;
use App\Models\ActivityLog;
use App\Services\BrevoEmailService;
use App\Services\PushNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class PendingApplicationController extends Controller
{
    public function index()
    {
        try {
            $applications = PendingApplication::where('status', 'pending')->get();

            // Add full URLs for logos
            foreach ($applications as $application) {
                if ($application->logo && !str_starts_with($application->logo, '/Assets/')) {
                    $application->logo = Storage::url($application->logo);
                } elseif (!$application->logo) {
                    $application->logo = '/Assets/disaster_logo.png';
                }
            }

            return response()->json($applications);
        } catch (\Exception $e) {
            Log::error('Error fetching pending applications: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch pending applications'], 500);
        }
    }

    public function show($id)
    {
        try {
            $application = PendingApplication::findOrFail($id);

            // Add full URL for logo
            if ($application->logo && !str_starts_with($application->logo, '/Assets/')) {
                $application->logo = Storage::url($application->logo);
            } elseif (!$application->logo) {
                $application->logo = '/Assets/disaster_logo.png';
            }

            return response()->json($application);
        } catch (\Exception $e) {
            Log::error('Error fetching pending application: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch pending application'], 500);
        }
    }

    public function approve($id)
    {
        DB::beginTransaction();
        try {
            $application = PendingApplication::findOrFail($id);

            if ($application->status !== 'pending') {
                return response()->json(['message' => 'Application is not pending'], 400);
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
                'otp_expires_at' => $otpExpiresAt
            ]);

            // Send OTP email to user using Brevo API (no recovery passcodes included)
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
                    Log::info('OTP email sent successfully via Brevo API', [
                        'email' => $application->email,
                        'organization' => $application->organization_name,
                        'messageId' => $result['messageId']
                    ]);
                } else {
                    Log::error('Failed to send OTP email via Brevo API', [
                        'email' => $application->email,
                        'error' => $result['error']
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Failed to send OTP email', [
                    'email' => $application->email,
                    'error' => $e->getMessage()
                ]);
            }

            // Log activity for application approval
            $approver = Auth::user();
            if ($approver) {
                ActivityLog::logActivity(
                    $approver->id,
                    'approve',
                    'Approved application for: ' . $application->organization_name,
                    [
                        'application_id' => $application->id,
                        'organization_name' => $application->organization_name,
                        'director_name' => $application->director_name,
                        'email' => $application->email
                    ],
                    null
                );
            }

            // Send push notification to admin about the approval/new application
            // This is actually a new application being submitted, so we should notify when it's created
            // But we can send a notification here too if needed

            DB::commit();

            return response()->json([
                'message' => 'Application approved successfully. OTP sent to user email.',
                'associate_group' => $associateGroup->load('user'),
                'recovery_passcodes' => $recoveryPasscodes
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error approving application: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to approve application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function reject(Request $request, $id)
    {
        try {
            $request->validate([
                'rejection_reason' => 'required|string|max:1000'
            ], [
                'rejection_reason.required' => 'Rejection reason is required.',
                'rejection_reason.max' => 'Rejection reason must not exceed 1000 characters.'
            ]);

            $application = PendingApplication::findOrFail($id);

            if ($application->status !== 'pending') {
                return response()->json(['message' => 'Application is not pending'], 400);
            }

            $application->update(['status' => 'rejected']);

            // Log activity for application rejection
            $rejector = Auth::user();
            if ($rejector) {
                ActivityLog::logActivity(
                    $rejector->id,
                    'reject',
                    'Rejected application for: ' . $application->organization_name,
                    [
                        'application_id' => $application->id,
                        'organization_name' => $application->organization_name,
                        'director_name' => $application->director_name,
                        'email' => $application->email,
                        'rejection_reason' => $request->rejection_reason
                    ],
                    null
                );
            }

            // Send rejection email to user using Brevo API
            try {
                $brevoService = new BrevoEmailService();

                // Render the email template
                $htmlContent = view('emails.application-rejected', [
                    'organizationName' => $application->organization_name,
                    'rejectionReason' => $request->rejection_reason,
                    'directorName' => $application->director_name
                ])->render();

                $result = $brevoService->sendEmail(
                    $application->email,
                    'Your Organization Application Has Been Rejected - DPAR Platform',
                    $htmlContent
                );

                if ($result['success']) {
                    Log::info('Rejection email sent successfully via Brevo API', [
                        'email' => $application->email,
                        'organization' => $application->organization_name,
                        'messageId' => $result['messageId']
                    ]);
                } else {
                    Log::error('Failed to send rejection email via Brevo API', [
                        'email' => $application->email,
                        'error' => $result['error']
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Failed to send rejection email', [
                    'email' => $application->email,
                    'error' => $e->getMessage(),
                    'rejection_reason' => $request->rejection_reason
                ]);
                // Don't fail the rejection if email fails, but log it
            }

            // Delete logo file if exists
            if ($application->logo && Storage::disk('public')->exists($application->logo)) {
                Storage::disk('public')->delete($application->logo);
            }

            return response()->json(['message' => 'Application rejected successfully. Rejection email sent to user.'], 200);
        } catch (\Exception $e) {
            Log::error('Error rejecting application: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to reject application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $application = PendingApplication::findOrFail($id);

            // Delete logo file if exists
            if ($application->logo && Storage::disk('public')->exists($application->logo)) {
                Storage::disk('public')->delete($application->logo);
            }

            $application->delete();

            return response()->json(['message' => 'Application deleted successfully'], 200);
        } catch (\Exception $e) {
            Log::error('Error deleting application: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate a recovery passcode for new associate accounts
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
