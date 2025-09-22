<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MemberController extends Controller
{
    // Return id and name of all associate group leaders
    public function index()
    {
        try {
            $members = DB::table('users')
                ->leftJoin('associate_groups', 'users.id', '=', 'associate_groups.user_id')
                ->where('users.role', 'associate_group_leader')
                ->select([
                    'users.id',
                    'users.name',
                    'users.organization',
                    'users.email',
                    'associate_groups.logo',
                    'associate_groups.type',
                    'associate_groups.director',
                    'associate_groups.description',
                    'associate_groups.phone',
                ])
                ->orderBy('users.name')
                ->get();

            // Get volunteer counts for each associate group
            foreach ($members as $member) {
                $volunteerCount = \App\Models\AssociateGroup::where('user_id', $member->id)
                    ->withCount('volunteers')
                    ->first();
                $member->members_count = $volunteerCount ? $volunteerCount->volunteers_count : 0;
            }

            // Process logo URLs
            foreach ($members as $member) {
                if ($member->logo && !str_starts_with($member->logo, '/Assets/')) {
                    $member->logo = url($member->logo);
                }
            }

            return response()->json($members);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching members: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $member = User::where('role', 'associate_group_leader')
                ->where('id', $id)
                ->select(['id', 'name', 'organization'])
                ->firstOrFail();

            return response()->json($member);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching member: ' . $e->getMessage()
            ], 500);
        }
    }

    // Get active members overview with activity data
    public function getActiveMembers(Request $request)
    {
        try {
            $period = $request->get('period', 'day'); // day, week, month

            // Get all associate group leaders
            $members = DB::table('users')
                ->leftJoin('associate_groups', 'users.id', '=', 'associate_groups.user_id')
                ->where('users.role', 'associate_group_leader')
                ->select([
                    'users.id',
                    'users.name',
                    'users.organization',
                    'users.email',
                    'associate_groups.logo',
                    'associate_groups.type',
                    'associate_groups.director',
                    'associate_groups.description',
                    'associate_groups.phone',
                ])
                ->orderBy('users.name')
                ->get();

            Log::info('Found ' . $members->count() . ' associate users');

            // Get active user IDs for the specified period
            $activeUserIds = ActivityLog::getActiveUsers($period);
            Log::info('Active user IDs: ' . $activeUserIds->implode(', '));

            // Process each member and add activity status
            foreach ($members as $member) {
                try {
                    $member->is_active = $activeUserIds->contains($member->id);

                    // Get last activity for this member
                    $lastActivity = ActivityLog::getLastActivity($member->id);
                    $member->last_activity = $lastActivity ? $lastActivity->activity_at : null;
                    $member->last_activity_type = $lastActivity ? $lastActivity->activity_type : null;

                    // Get volunteer count
                    $volunteerCount = \App\Models\AssociateGroup::where('user_id', $member->id)
                        ->withCount('volunteers')
                        ->first();
                    $member->members_count = $volunteerCount ? $volunteerCount->volunteers_count : 0;
                } catch (\Exception $e) {
                    Log::error('Error processing member ' . $member->id . ': ' . $e->getMessage());
                    // Set default values for this member
                    $member->is_active = false;
                    $member->last_activity = null;
                    $member->last_activity_type = null;
                    $member->members_count = 0;
                }
            }

            // Process logo URLs
            foreach ($members as $member) {
                if ($member->logo && !str_starts_with($member->logo, '/Assets/')) {
                    $member->logo = url($member->logo);
                }
            }

            // Calculate statistics
            $totalAssociates = $members->count();
            $activeAssociates = $members->where('is_active', true)->count();

            return response()->json([
                'members' => $members,
                'statistics' => [
                    'total_associates' => $totalAssociates,
                    'active_associates' => $activeAssociates,
                    'period' => $period
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching active members: ' . $e->getMessage()
            ], 500);
        }
    }
}
