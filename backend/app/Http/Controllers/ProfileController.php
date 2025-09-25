<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Models\AssociateGroup;
use App\Models\DirectorHistory;
use App\Models\Volunteer;

class ProfileController extends Controller
{
    public function getProfile()
    {
        $user = Auth::user();
        $associateGroup = AssociateGroup::where('user_id', $user->id)->first();

        return response()->json([
            'name' => $user->name,
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

    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . Auth::id(),
            'director' => 'nullable|string|max:255',
            'type' => 'nullable|string|max:255',
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        DB::beginTransaction();
        try {
            $user = Auth::user();
            /** @var \App\Models\User $user */

            // Store original values for comparison
            $originalName = $user->name;
            $originalEmail = $user->email;

            $user->name = $request->name;
            $user->email = $request->email;

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
            if ($associateGroup) {
                // Check if director name or email changed (indicating a director change)
                $directorChanged = false;
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
            return response()->json([
                'message' => 'Profile updated successfully',
                'profile_picture_url' => $user->profile_picture ? asset('storage/' . $user->profile_picture) : null
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
