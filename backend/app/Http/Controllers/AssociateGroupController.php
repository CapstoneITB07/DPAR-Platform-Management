<?php

namespace App\Http\Controllers;

use App\Models\AssociateGroup;
use App\Models\User;
use App\Models\DirectorHistory;
use App\Models\DirectorAchievement;
use App\Models\Volunteer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class AssociateGroupController extends Controller
{
    public function index()
    {
        try {
            $groups = AssociateGroup::with('user')->whereNull('deleted_at')->get();
            // Add full URLs for logos
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

    public function publicIndex()
    {
        try {
            $groups = AssociateGroup::select('id', 'name', 'type', 'director', 'description', 'logo', 'email', 'phone')
                ->whereNull('deleted_at')
                ->get();

            // Add full URLs for logos
            foreach ($groups as $group) {
                if ($group->logo && !str_starts_with($group->logo, '/Assets/')) {
                    $group->logo = Storage::url($group->logo);
                }
            }
            return response()->json($groups);
        } catch (\Exception $e) {
            Log::error('Error fetching public associate groups: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch associate groups'], 500);
        }
    }

    public function show($id)
    {
        try {
            $group = AssociateGroup::with(['user', 'directorHistoriesWithActivities'])
                ->whereNull('deleted_at')
                ->findOrFail($id);

            // Add full URL for logos
            if ($group->logo && !str_starts_with($group->logo, '/Assets/')) {
                $group->logo = Storage::url($group->logo);
            }
            return response()->json($group);
        } catch (\Exception $e) {
            Log::error('Error fetching associate group: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch associate group'], 500);
        }
    }

    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'type' => 'nullable|string|max:255',
                'director' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
                'email' => 'required|email|unique:users,email',
                'phone' => ['required', 'string', 'size:11', 'regex:/^09[0-9]{9}$/'],
                'date_joined' => 'required|date|before_or_equal:today',
            ], [
                'name.required' => 'Organization name is required.',
                'email.required' => 'Email address is required.',
                'email.email' => 'Please enter a valid email address.',
                'email.unique' => 'This email is already used by another associate group.',
                'phone.required' => 'Phone number is required.',
                'phone.size' => 'Phone number must be exactly 11 digits.',
                'phone.regex' => 'Phone number must start with 09 and contain only numbers.',
                'date_joined.required' => 'Date joined is required.',
                'date_joined.date' => 'Please enter a valid date.',
                'date_joined.before_or_equal' => 'Date joined cannot be in the future.',
                'logo.required' => 'Logo is required for new associate groups.',
                'logo.image' => 'Logo must be a valid image file.',
                'logo.mimes' => 'Logo must be in JPEG, PNG, JPG, or GIF format.',
                'logo.max' => 'Logo file size must not exceed 2MB.',
            ]);

            // Auto-generate a strong password
            // Generate three recovery passcodes
            $recoveryPasscodes = [
                $this->generateRecoveryPasscode(),
                $this->generateRecoveryPasscode(),
                $this->generateRecoveryPasscode()
            ];

            // Create user account with a temporary password that must be changed on first login
            $tempPassword = 'TempPassword' . random_int(1000, 9999); // Simple temp password
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($tempPassword),
                'role' => 'associate_group_leader',
                'organization' => $request->name,
                'recovery_passcodes' => $recoveryPasscodes,
                'needs_password_change' => true, // Force password change on first login
            ]);

            // Handle logo upload
            $logoPath = '/Assets/disaster_logo.png';  // Set default logo path
            if ($request->hasFile('logo')) {
                $path = $request->file('logo')->store('logos', 'public');
                $logoPath = $path;

                // Update user's profile picture to match the logo
                $user->update(['profile_picture' => $path]);
            }

            $group = AssociateGroup::create([
                'user_id' => $user->id,
                'name' => $request->name,
                'type' => $request->type,
                'director' => $request->director, // Store actual director name, not org name
                'description' => $request->description,
                'logo' => $logoPath,
                'email' => $request->email,
                'phone' => $request->phone,
                'date_joined' => $request->date_joined,
            ]);

            // Create initial director history record for the first director
            if ($request->director) {
                DirectorHistory::create([
                    'associate_group_id' => $group->id,
                    'director_name' => $request->director,
                    'director_email' => $request->email,
                    'contributions' => 'Initial director - ' . $request->director,
                    'volunteers_recruited' => 0,
                    'reports_submitted' => 0,
                    'notifications_responded' => 0,
                    'logins' => 0,
                    'start_date' => $request->date_joined,
                    'is_current' => true
                ]);
            }

            // Return the group with the full logo URL for immediate display
            $group = $group->fresh(['user', 'directorHistoriesWithActivities']);
            if ($group->logo && !str_starts_with($group->logo, '/Assets/')) {
                $group->logo = Storage::url($group->logo);
            }

            // Include the recovery passcodes in the response for admin viewing
            $responseData = $group->load('user')->toArray();
            $responseData['recovery_passcodes'] = $recoveryPasscodes;

            DB::commit();
            return response()->json($responseData, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating associate group: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to create associate group',
                'error' => $e->getMessage()
            ], 422);
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

    /**
     * View existing recovery passcodes for an associate group
     */
    public function getRecoveryPasscodes($id)
    {
        try {
            $group = AssociateGroup::with('user')->findOrFail($id);

            // Check if user is admin (you may need to adjust this based on your auth system)
            if (!Auth::user() || Auth::user()->role !== 'head_admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if (!$group->user) {
                return response()->json(['message' => 'No user account found for this associate group.'], 404);
            }

            // Return the existing recovery passcodes
            $recoveryPasscodes = $group->user->recovery_passcodes ?? [];

            // Log the recovery passcodes being returned
            Log::info('Fetching recovery passcodes for admin', [
                'associate_id' => $id,
                'associate_name' => $group->name,
                'user_id' => $group->user->id,
                'recovery_passcodes' => $recoveryPasscodes,
                'count' => count($recoveryPasscodes)
            ]);

            return response()->json([
                'associate_name' => $group->name,
                'email' => $group->email,
                'recovery_passcodes' => $recoveryPasscodes
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching recovery passcodes: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch recovery passcodes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $group = AssociateGroup::with('user')->findOrFail($id);

            // Separate validation rules for with and without logo
            $validationRules = [
                'name' => 'required|string|max:255',
                'type' => 'nullable|string|max:255',
                'director' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'email' => 'required|email|unique:users,email,' . $group->user_id,
                'phone' => ['required', 'string', 'size:11', 'regex:/^09[0-9]{9}$/'],
                'date_joined' => 'required|date|before_or_equal:today',
            ];

            $customMessages = [
                'name.required' => 'Organization name is required.',
                'email.required' => 'Email address is required.',
                'email.email' => 'Please enter a valid email address.',
                'email.unique' => 'This email is already used by another associate group.',
                'phone.required' => 'Phone number is required.',
                'phone.size' => 'Phone number must be exactly 11 digits.',
                'phone.regex' => 'Phone number must start with 09 and contain only numbers.',
                'date_joined.required' => 'Date joined is required.',
                'date_joined.date' => 'Please enter a valid date.',
                'date_joined.before_or_equal' => 'Date joined cannot be in the future.',
            ];

            // Add logo validation only if a file is being uploaded
            if ($request->hasFile('logo')) {
                $validationRules['logo'] = 'image|mimes:jpeg,png,jpg,gif|max:2048';
                $customMessages['logo.image'] = 'Logo must be a valid image file.';
                $customMessages['logo.mimes'] = 'Logo must be in JPEG, PNG, JPG, or GIF format.';
                $customMessages['logo.max'] = 'Logo file size must not exceed 2MB.';
            }

            // Use explicit field access instead of $request->all() for PUT requests
            $validated = $request->validate($validationRules, $customMessages);

            // Explicitly get the validated data
            $validatedData = [
                'name' => $request->input('name'),
                'type' => $request->input('type'),
                'director' => $request->input('director'),
                'description' => $request->input('description'),
                'email' => $request->input('email'),
                'phone' => $request->input('phone'),
                'date_joined' => $request->input('date_joined')
            ];

            // Check if director name or email changed
            $directorChanged = false;
            $previousDirector = null;
            $originalDirectorName = null;
            $originalDirectorEmail = null;

            // Check if director actually changed by comparing with the stored director field
            if (
                $group->user &&
                ($group->director !== $validatedData['director'] ||
                    $group->user->email !== $validatedData['email'])
            ) {
                $directorChanged = true;
                $previousDirector = $group->user;
                // Use the stored director name from associate group, not user name
                $originalDirectorName = $group->director;
                $originalDirectorEmail = $group->user->email;
            }

            // Update user account if it exists
            if ($group->user) {
                $group->user->update([
                    'name' => $validatedData['name'], // User name should be the organization name
                    'email' => $validatedData['email'],
                    'organization' => $validatedData['name'], // Organization name goes to organization field
                ]);
            }

            // Handle logo upload if a new file is provided
            if ($request->hasFile('logo')) {
                try {
                    // Delete old logo if it exists and is not a default Asset
                    if ($group->logo && !str_starts_with($group->logo, '/Assets/')) {
                        Storage::delete('public/' . $group->logo);
                    }

                    $path = $request->file('logo')->store('logos', 'public');
                    $group->logo = $path;

                    // Update user's profile picture to match the logo
                    if ($group->user) {
                        $group->user->update(['profile_picture' => $path]);
                    }
                } catch (\Exception $e) {
                    Log::error('Error handling logo upload: ' . $e->getMessage());
                    throw new \Exception('Failed to process logo upload: ' . $e->getMessage());
                }
            }

            // Update group details
            $updateData = [
                'name' => $validatedData['name'],
                'type' => $validatedData['type'] ?? $group->type,
                'director' => $validatedData['director'] ?? $group->director,
                'description' => $validatedData['description'] ?? $group->description,
                'email' => $validatedData['email'],
                'phone' => $validatedData['phone'],
            ];

            $group->update($updateData);

            // If director changed, create director history entry for previous director
            if ($directorChanged && $previousDirector) {
                // Get the current director history record
                $currentDirectorHistory = DirectorHistory::where('associate_group_id', $group->id)
                    ->where('is_current', true)
                    ->first();

                if ($currentDirectorHistory) {
                    // Update the current record to mark it as former director with end date
                    $currentDirectorHistory->update([
                        'is_current' => false,
                        'end_date' => now()->subDay()->toDateString(), // Set end date to yesterday so activities are properly separated
                        'director_name' => $originalDirectorName, // Ensure we use the original name
                        'director_email' => $originalDirectorEmail
                    ]);

                    // Get activity summary for previous director
                    $activitySummary = $this->getDirectorActivitySummary($previousDirector->id);

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

                // Generate achievements for previous director
                $this->generateDirectorAchievements($group->id, $previousDirector->id, $activitySummary);

                // Create director history entry for new director (only if it's a real change)
                $existingCurrentHistory = DirectorHistory::where('associate_group_id', $group->id)
                    ->where('director_email', $validatedData['email'])
                    ->where('is_current', true)
                    ->first();

                if (!$existingCurrentHistory) {
                    // Create director history entry for new director with reset counts
                    DirectorHistory::create([
                        'associate_group_id' => $group->id,
                        'director_name' => $validatedData['director'],
                        'director_email' => $validatedData['email'],
                        'contributions' => 'New director - ' . $validatedData['director'],
                        'volunteers_recruited' => 0, // Start with 0 volunteers
                        'reports_submitted' => 0,
                        'notifications_responded' => 0,
                        'logins' => 0,
                        'start_date' => now()->toDateString(),
                        'is_current' => true
                    ]);
                }
            }

            // Refresh the model to get the latest data
            $group = $group->fresh(['user', 'directorHistoriesWithActivities']);

            // Format logo URL for response
            if ($group->logo && !str_starts_with($group->logo, '/Assets/')) {
                $group->logo = Storage::url($group->logo);
            }

            DB::commit();
            return response()->json($group);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            Log::error('Validation error updating associate group: ' . json_encode($e->errors()));
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

    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $group = AssociateGroup::with('user')->findOrFail($id);

            // Soft delete using Laravel's built-in method
            $group->delete();

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
     * Get the password for an associate group (admin only)
     */
    public function getPassword($id)
    {
        try {
            $group = AssociateGroup::with('user')->findOrFail($id);

            // Check if user is admin (you may need to adjust this based on your auth system)
            if (!Auth::user() || Auth::user()->role !== 'head_admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Return the temporary password if it exists
            if ($group->user && $group->user->temp_password) {
                return response()->json([
                    'associate_name' => $group->name,
                    'email' => $group->email,
                    'password' => $group->user->temp_password
                ]);
            } else {
                return response()->json([
                    'message' => 'Password not available. It may have been cleared for security.',
                    'associate_name' => $group->name,
                    'email' => $group->email
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error fetching associate password: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch password'], 500);
        }
    }

    /**
     * Clear temporary password for security (admin only)
     */
    public function clearTempPassword($id)
    {
        try {
            $group = AssociateGroup::with('user')->findOrFail($id);

            // Check if user is admin
            if (!Auth::user() || Auth::user()->role !== 'head_admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Clear the temporary password
            if ($group->user) {
                $group->user->update(['temp_password' => null]);
            }

            return response()->json(['message' => 'Temporary password cleared successfully']);
        } catch (\Exception $e) {
            Log::error('Error clearing temporary password: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to clear password'], 500);
        }
    }

    /**
     * Get director activity summary for the previous director's tenure
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

        // Get the associate group to find the director history
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

        // Get the current director history to get the tenure period
        $currentDirectorHistory = DirectorHistory::where('associate_group_id', $associateGroup->id)
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
            // Get the volunteer count that was saved when the previous director ended
            $previousDirectorHistory = DirectorHistory::where('associate_group_id', $associateGroup->id)
                ->where('is_current', false)
                ->where('end_date', $startDate)
                ->first();

            if ($previousDirectorHistory) {
                // Use the saved volunteer count from the previous director's history
                $volunteersCount = $previousDirectorHistory->volunteers_recruited;
            } else {
                // Fallback: count all volunteers if no previous history found
                $volunteersCount = $user->volunteers()->count();
            }
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

    /**
     * Generate achievements for a director
     */
    private function generateDirectorAchievements($associateGroupId, $userId, $activitySummary)
    {
        $directorHistory = DirectorHistory::where('associate_group_id', $associateGroupId)
            ->where('director_email', User::find($userId)->email)
            ->where('is_current', false)
            ->latest()
            ->first();

        if (!$directorHistory) return;

        $achievements = [];

        // Generate achievements based on activities
        if ($activitySummary['notifications_created'] >= 5) {
            $achievements[] = [
                'title' => 'Communication Champion',
                'description' => 'Created ' . $activitySummary['notifications_created'] . ' notifications',
                'achievement_type' => 'communication',
                'points_earned' => min(50, $activitySummary['notifications_created'] * 5),
                'badge_icon' => 'fa-bullhorn',
                'badge_color' => '#007bff',
                'is_milestone' => $activitySummary['notifications_created'] >= 20,
                'achieved_at' => now()
            ];
        }

        if ($activitySummary['reports_submitted'] >= 3) {
            $achievements[] = [
                'title' => 'Report Master',
                'description' => 'Submitted ' . $activitySummary['reports_submitted'] . ' reports',
                'achievement_type' => 'reporting',
                'points_earned' => min(75, $activitySummary['reports_submitted'] * 10),
                'badge_icon' => 'fa-file-alt',
                'badge_color' => '#28a745',
                'is_milestone' => $activitySummary['reports_submitted'] >= 10,
                'achieved_at' => now()
            ];
        }

        if ($activitySummary['volunteers_recruited'] >= 10) {
            $achievements[] = [
                'title' => 'Recruitment Leader',
                'description' => 'Recruited ' . $activitySummary['volunteers_recruited'] . ' volunteers',
                'achievement_type' => 'recruitment',
                'points_earned' => min(100, $activitySummary['volunteers_recruited'] * 5),
                'badge_icon' => 'fa-users',
                'badge_color' => '#ffc107',
                'is_milestone' => $activitySummary['volunteers_recruited'] >= 50,
                'achieved_at' => now()
            ];
        }


        // Save achievements
        foreach ($achievements as $achievement) {
            DirectorAchievement::create([
                'director_history_id' => $directorHistory->id,
                ...$achievement
            ]);
        }
    }

    /**
     * Clean up incorrect director history entries
     */
    public function cleanupDirectorHistory($id)
    {
        try {
            $group = AssociateGroup::findOrFail($id);

            // Get all director histories for this group
            $histories = DirectorHistory::where('associate_group_id', $id)->get();

            // Find entries where director_name matches the organization name (incorrect)
            $incorrectEntries = $histories->where('director_name', $group->name);

            $cleanedCount = 0;
            foreach ($incorrectEntries as $entry) {
                // Delete entries where director name matches organization name
                $entry->delete();
                $cleanedCount++;
            }

            // Also clean up any duplicate entries for the same director
            $directorNames = $histories->pluck('director_name')->unique();
            foreach ($directorNames as $directorName) {
                if ($directorName !== $group->name) { // Skip org name entries
                    $duplicates = DirectorHistory::where('associate_group_id', $id)
                        ->where('director_name', $directorName)
                        ->where('is_current', false)
                        ->orderBy('created_at', 'desc')
                        ->skip(1) // Keep the most recent one
                        ->get();

                    foreach ($duplicates as $duplicate) {
                        $duplicate->delete();
                        $cleanedCount++;
                    }
                }
            }

            return response()->json([
                'message' => 'Director history cleaned up successfully',
                'entries_removed' => $cleanedCount
            ]);
        } catch (\Exception $e) {
            Log::error('Error cleaning up director history: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to clean up director history'], 500);
        }
    }

    /**
     * Clean up all director history entries across all associate groups
     */
    public function cleanupAllDirectorHistory()
    {
        try {
            $groups = AssociateGroup::all();
            $totalCleaned = 0;

            foreach ($groups as $group) {
                // Get all director histories for this group
                $histories = DirectorHistory::where('associate_group_id', $group->id)->get();

                // Find entries where director_name matches the organization name (incorrect)
                $incorrectEntries = $histories->where('director_name', $group->name);

                foreach ($incorrectEntries as $entry) {
                    $entry->delete();
                    $totalCleaned++;
                }

                // Clean up duplicates for each director
                $directorNames = $histories->pluck('director_name')->unique();
                foreach ($directorNames as $directorName) {
                    if ($directorName !== $group->name) {
                        $duplicates = DirectorHistory::where('associate_group_id', $group->id)
                            ->where('director_name', $directorName)
                            ->where('is_current', false)
                            ->orderBy('created_at', 'desc')
                            ->skip(1)
                            ->get();

                        foreach ($duplicates as $duplicate) {
                            $duplicate->delete();
                            $totalCleaned++;
                        }
                    }
                }
            }

            return response()->json([
                'message' => 'All director history cleaned up successfully',
                'entries_removed' => $totalCleaned
            ]);
        } catch (\Exception $e) {
            Log::error('Error cleaning up all director history: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to clean up all director history'], 500);
        }
    }

    /**
     * Fix director field in associate groups where it contains organization name
     */
    public function fixDirectorFields()
    {
        try {
            $groups = AssociateGroup::with('user')->get();
            $fixedCount = 0;

            foreach ($groups as $group) {
                // Check if director field contains organization name (incorrect)
                if ($group->director === $group->name) {
                    // Try to get the correct director name from the current director history
                    $currentDirector = DirectorHistory::where('associate_group_id', $group->id)
                        ->where('is_current', true)
                        ->first();

                    if ($currentDirector) {
                        $group->update(['director' => $currentDirector->director_name]);
                        $fixedCount++;
                    } else if ($group->user) {
                        // Fallback to user name if no director history
                        $group->update(['director' => $group->user->name]);
                        $fixedCount++;
                    }
                }
            }

            return response()->json([
                'message' => 'Director fields fixed successfully',
                'groups_fixed' => $fixedCount
            ]);
        } catch (\Exception $e) {
            Log::error('Error fixing director fields: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fix director fields'], 500);
        }
    }
}
