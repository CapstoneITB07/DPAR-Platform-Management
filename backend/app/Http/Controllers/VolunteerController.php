<?php

namespace App\Http\Controllers;

use App\Models\Volunteer;
use App\Models\AssociateGroup;
use App\Models\ActivityLog;
use App\Models\DirectorHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class VolunteerController extends Controller
{
    public function index()
    {
        $associateGroup = AssociateGroup::where('user_id', Auth::id())->first();
        if (!$associateGroup) {
            return response()->json(['message' => 'Associate group not found'], 404);
        }

        $volunteers = $associateGroup->volunteers;
        return response()->json($volunteers);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'gender' => 'required|in:Male,Female',
            'address' => 'required|string',
            'contact_info' => 'required|string|max:11',
            'expertise' => 'nullable|string',
        ]);

        $associateGroup = AssociateGroup::where('user_id', Auth::id())->first();
        if (!$associateGroup) {
            return response()->json(['message' => 'Associate group not found'], 404);
        }

        // Check for duplicate volunteer by name only
        $existingByName = $associateGroup->volunteers()
            ->where('name', $request->name)
            ->first();

        if ($existingByName) {
            return response()->json([
                'message' => 'A volunteer with this name already exists',
                'errors' => [
                    'duplicate' => 'A volunteer with this name already exists in your group'
                ]
            ], 422);
        }

        $volunteer = $associateGroup->volunteers()->create($request->all());

        // Log activity for volunteer recruitment
        $directorHistoryId = DirectorHistory::getCurrentDirectorHistoryId(Auth::id());
        ActivityLog::logActivity(
            Auth::id(),
            'volunteer_recruited',
            'Recruited a new volunteer: ' . $volunteer->name,
            [
                'volunteer_id' => $volunteer->id,
                'volunteer_name' => $volunteer->name,
                'volunteer_gender' => $volunteer->gender,
                'volunteer_expertise' => $volunteer->expertise
            ],
            $directorHistoryId
        );

        // Update current director's volunteer count
        DirectorHistory::where('associate_group_id', $associateGroup->id)
            ->where('is_current', true)
            ->increment('volunteers_recruited');

        return response()->json($volunteer, 201);
    }

    public function update(Request $request, Volunteer $volunteer)
    {
        $associateGroup = AssociateGroup::where('user_id', Auth::id())->first();
        if (!$associateGroup || $volunteer->associate_group_id !== $associateGroup->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string',
            'gender' => 'required|in:Male,Female',
            'address' => 'required|string',
            'contact_info' => 'required|string|max:11',
            'expertise' => 'nullable|string',
        ]);

        // Check for duplicate volunteer by name only (excluding current volunteer)
        $existingByName = $associateGroup->volunteers()
            ->where('name', $request->name)
            ->where('id', '!=', $volunteer->id)
            ->first();

        if ($existingByName) {
            return response()->json([
                'message' => 'A volunteer with this name already exists',
                'errors' => [
                    'duplicate' => 'A volunteer with this name already exists in your group'
                ]
            ], 422);
        }

        $volunteer->update($request->all());
        return response()->json($volunteer);
    }

    public function destroy(Volunteer $volunteer)
    {
        $associateGroup = AssociateGroup::where('user_id', Auth::id())->first();
        if (!$associateGroup || $volunteer->associate_group_id !== $associateGroup->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $volunteer->delete();

        // Update current director's volunteer count
        DirectorHistory::where('associate_group_id', $associateGroup->id)
            ->where('is_current', true)
            ->decrement('volunteers_recruited');

        return response()->json(null, 204);
    }

    public function count()
    {
        $associateGroup = AssociateGroup::where('user_id', Auth::id())->first();
        if (!$associateGroup) {
            return response()->json(['message' => 'Associate group not found'], 404);
        }

        $count = $associateGroup->volunteers()->count();
        return response()->json(['count' => $count]);
    }
}
