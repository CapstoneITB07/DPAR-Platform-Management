<?php

namespace App\Http\Controllers;

use App\Models\Volunteer;
use App\Models\AssociateGroup;
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

        $volunteer = $associateGroup->volunteers()->create($request->all());
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
