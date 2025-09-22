<?php

namespace App\Http\Controllers;

use App\Models\DirectorHistory;
use App\Models\DirectorAchievement;
use App\Models\ActivityLog;
use App\Models\AssociateGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class DirectorHistoryController extends Controller
{
    /**
     * Get director history for an associate group
     */
    public function index($associateGroupId)
    {
        try {
            $directorHistories = DirectorHistory::where('associate_group_id', $associateGroupId)
                ->with(['user', 'achievements'])
                ->orderBy('start_date', 'desc')
                ->get();

            return response()->json($directorHistories);
        } catch (\Exception $e) {
            Log::error('Error fetching director history: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch director history'], 500);
        }
    }

    /**
     * Store a new director history
     */
    public function store(Request $request, $associateGroupId)
    {
        try {
            $request->validate([
                'director_name' => 'required|string|max:255',
                'director_email' => 'nullable|email|max:255',
                'contributions' => 'required|string',
                'volunteers_recruited' => 'integer|min:0',
                'events_organized' => 'integer|min:0',
                'start_date' => 'required|date',
                'reason_for_leaving' => 'nullable|string|max:255',
                'is_new_director' => 'boolean'
            ]);

            DB::beginTransaction();

            // If this is a new director, end the current directorship
            if ($request->is_new_director) {
                DirectorHistory::where('associate_group_id', $associateGroupId)
                    ->where('is_current', true)
                    ->update([
                        'is_current' => false,
                        'end_date' => now()->toDateString(),
                        'reason_for_leaving' => $request->reason_for_leaving
                    ]);
            }

            // Create new director history
            $directorHistory = DirectorHistory::create([
                'associate_group_id' => $associateGroupId,
                'director_name' => $request->director_name,
                'director_email' => $request->director_email,
                'contributions' => $request->contributions,
                'volunteers_recruited' => $request->volunteers_recruited ?? 0,
                'events_organized' => $request->events_organized ?? 0,
                'start_date' => $request->start_date,
                'is_current' => $request->is_new_director ?? false
            ]);

            // Update associate group director name
            AssociateGroup::where('id', $associateGroupId)
                ->update(['director' => $request->director_name]);

            DB::commit();

            return response()->json($directorHistory->load(['user', 'achievements']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating director history: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to create director history'], 500);
        }
    }

    /**
     * Get achievements for a director
     */
    public function getAchievements($directorHistoryId)
    {
        try {
            $directorHistory = DirectorHistory::with(['achievements', 'user'])->findOrFail($directorHistoryId);

            $achievementSummary = [
                'total_achievements' => $directorHistory->achievements->count(),
                'total_points' => $directorHistory->achievements->sum('points_earned'),
                'milestone_achievements' => $directorHistory->achievements->where('is_milestone', true)->count()
            ];

            return response()->json([
                'director_history' => $directorHistory,
                'achievement_summary' => $achievementSummary
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching director achievements: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch achievements'], 500);
        }
    }

    /**
     * Generate achievements for a director based on their activities
     */
    public function generateAchievements($directorHistoryId)
    {
        try {
            $directorHistory = DirectorHistory::with(['user', 'activityLogs', 'notifications', 'reports'])->findOrFail($directorHistoryId);

            if (!$directorHistory->user) {
                return response()->json(['message' => 'No user account found for this director'], 404);
            }

            $activitySummary = $directorHistory->getActivitySummary();
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

            if ($activitySummary['events_organized'] >= 5) {
                $achievements[] = [
                    'title' => 'Event Organizer',
                    'description' => 'Organized ' . $activitySummary['events_organized'] . ' events',
                    'achievement_type' => 'events',
                    'points_earned' => min(100, $activitySummary['events_organized'] * 15),
                    'badge_icon' => 'fa-calendar',
                    'badge_color' => '#17a2b8',
                    'is_milestone' => $activitySummary['events_organized'] >= 20,
                    'achieved_at' => now()
                ];
            }

            if ($activitySummary['system_engagement_score'] >= 80) {
                $achievements[] = [
                    'title' => 'System Champion',
                    'description' => 'High system engagement with score of ' . $activitySummary['system_engagement_score'],
                    'achievement_type' => 'engagement',
                    'points_earned' => 100,
                    'badge_icon' => 'fa-trophy',
                    'badge_color' => '#dc3545',
                    'is_milestone' => true,
                    'achieved_at' => now()
                ];
            }

            // Save achievements
            foreach ($achievements as $achievement) {
                DirectorAchievement::create([
                    'director_history_id' => $directorHistoryId,
                    ...$achievement
                ]);
            }

            return response()->json([
                'message' => 'Achievements generated successfully',
                'achievements_created' => count($achievements)
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating achievements: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to generate achievements'], 500);
        }
    }

    /**
     * End directorship and generate achievements
     */
    public function endDirectorship($directorHistoryId, Request $request)
    {
        try {
            $request->validate([
                'reason_for_leaving' => 'required|string|max:255'
            ]);

            DB::beginTransaction();

            $directorHistory = DirectorHistory::findOrFail($directorHistoryId);
            $directorHistory->update([
                'is_current' => false,
                'end_date' => now()->toDateString(),
                'reason_for_leaving' => $request->reason_for_leaving
            ]);

            // Generate achievements
            $this->generateAchievements($directorHistoryId);

            DB::commit();

            return response()->json(['message' => 'Directorship ended and achievements generated']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error ending directorship: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to end directorship'], 500);
        }
    }

    /**
     * Get director activity logs and summary
     */
    public function getDirectorActivities($directorHistoryId)
    {
        try {
            $directorHistory = DirectorHistory::with(['user', 'activityLogs', 'notifications', 'reports'])->findOrFail($directorHistoryId);

            $activitySummary = $directorHistory->getActivitySummary();
            $recentActivities = $directorHistory->getRecentActivities(20);

            return response()->json([
                'director_history' => $directorHistory,
                'activity_summary' => $activitySummary,
                'recent_activities' => $recentActivities
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching director activities: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch director activities'], 500);
        }
    }
}
