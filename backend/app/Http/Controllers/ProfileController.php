<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Models\AssociateGroup;
use App\Models\DirectorHistory;

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
                    // End current directorship
                    DirectorHistory::where('associate_group_id', $associateGroup->id)
                        ->where('is_current', true)
                        ->update([
                            'is_current' => false,
                            'end_date' => now()->toDateString()
                        ]);

                    // Get activity summary for previous director
                    $activitySummary = $this->getDirectorActivitySummary($user->id);

                    // Use the original director name before the update
                    $previousDirectorName = $originalDirectorName; // This is the actual previous director's name

                    // Check if previous director already has a history entry to avoid duplicates
                    $existingHistory = DirectorHistory::where('associate_group_id', $associateGroup->id)
                        ->where('director_name', $previousDirectorName)
                        ->where('director_email', $originalEmail)
                        ->where('is_current', false)
                        ->first();

                    if (!$existingHistory) {
                        // Create director history entry for previous director
                        DirectorHistory::create([
                            'associate_group_id' => $associateGroup->id,
                            'director_name' => $previousDirectorName, // Use original director name
                            'director_email' => $originalEmail,
                            'contributions' => 'Previous director - ' . $activitySummary['contributions_summary'],
                            'volunteers_recruited' => $activitySummary['volunteers_recruited'],
                            'reports_submitted' => $activitySummary['reports_submitted'],
                            'notifications_responded' => $activitySummary['notifications_created'],
                            'logins' => $activitySummary['total_activities'],
                            'start_date' => $user->created_at->toDateString(),
                            'end_date' => now()->toDateString(),
                            'is_current' => false
                        ]);
                    }

                    // Create director history entry for new director (only if it's a real change)
                    $existingCurrentHistory = DirectorHistory::where('associate_group_id', $associateGroup->id)
                        ->where('director_email', $request->email)
                        ->where('is_current', true)
                        ->first();

                    if (!$existingCurrentHistory) {
                        // Create director history entry for new director
                        DirectorHistory::create([
                            'associate_group_id' => $associateGroup->id,
                            'director_name' => $request->director,
                            'director_email' => $request->email,
                            'contributions' => 'New director - ' . $request->director,
                            'volunteers_recruited' => 0,
                            'reports_submitted' => 0,
                            'notifications_responded' => 0,
                            'logins' => 0,
                            'start_date' => now()->toDateString(),
                            'is_current' => true
                        ]);
                    }
                }

                // Update the associate group name, director, and type
                $associateGroup->name = $request->name;
                if ($request->has('director')) {
                    $associateGroup->director = $request->director; // Store actual director name
                }
                if ($request->has('type')) {
                    $associateGroup->type = $request->type;
                }
                $associateGroup->save();
            }

            DB::commit();
            return response()->json(['message' => 'Profile updated successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update profile: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get director activity summary
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

        $notificationsCount = $user->notifications()->count();
        $reportsCount = $user->reports()->count();
        $activitiesCount = $user->activityLogs()->count();
        $volunteersCount = $user->volunteers()->count();

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
