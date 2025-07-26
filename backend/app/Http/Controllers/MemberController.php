<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\DB;

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
}
