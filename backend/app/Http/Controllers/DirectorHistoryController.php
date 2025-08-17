<?php

namespace App\Http\Controllers;

use App\Models\DirectorHistory;
use App\Models\AssociateGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DirectorHistoryController extends Controller
{
    /**
     * Get director history for an associate group
     */
    public function index($associateGroupId)
    {
        try {
            $directorHistories = DirectorHistory::where('associate_group_id', $associateGroupId)
                ->orderBy('start_date', 'desc')
                ->get();

            return response()->json($directorHistories);
        } catch (\Exception $e) {
            Log::error('Error fetching director history: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch director history'], 500);
        }
    }

    /**
     * Add a new director or update current director
     */
    public function store(Request $request, $associateGroupId)
    {
        try {
            $request->validate([
                'director_name' => 'required|string|max:255',
                'director_email' => 'nullable|email|max:255',
                'contributions' => 'nullable|string',
                'volunteers_recruited' => 'nullable|integer|min:0',
                'events_organized' => 'nullable|integer|min:0',
                'start_date' => 'required|date',
                'reason_for_leaving' => 'nullable|string|max:255'
            ]);

            DB::beginTransaction();

            // If this is a new director, mark the previous one as former
            if ($request->input('is_new_director', false)) {
                DirectorHistory::where('associate_group_id', $associateGroupId)
                    ->where('is_current', true)
                    ->update([
                        'is_current' => false,
                        'end_date' => now()->toDateString(),
                        'reason_for_leaving' => $request->input('reason_for_leaving', 'Passed to new director')
                    ]);
            }

            // Create new director history record
            $directorHistory = DirectorHistory::create([
                'associate_group_id' => $associateGroupId,
                'director_name' => $request->director_name,
                'director_email' => $request->director_email,
                'contributions' => $request->contributions,
                'volunteers_recruited' => $request->volunteers_recruited ?? 0,
                'events_organized' => $request->events_organized ?? 0,
                'start_date' => $request->start_date,
                'is_current' => true
            ]);

            // Update the associate group director field
            $associateGroup = AssociateGroup::find($associateGroupId);
            if ($associateGroup) {
                $associateGroup->update(['director' => $request->director_name]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Director history updated successfully',
                'director_history' => $directorHistory
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating director history: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update director history'], 500);
        }
    }

    /**
     * Update director contributions
     */
    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'contributions' => 'nullable|string',
                'volunteers_recruited' => 'nullable|integer|min:0',
                'events_organized' => 'nullable|integer|min:0',
                'reason_for_leaving' => 'nullable|string|max:255'
            ]);

            $directorHistory = DirectorHistory::findOrFail($id);

            $directorHistory->update($request->only([
                'contributions',
                'volunteers_recruited',
                'events_organized',
                'reason_for_leaving'
            ]));

            return response()->json([
                'message' => 'Director contributions updated successfully',
                'director_history' => $directorHistory
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating director contributions: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update director contributions'], 500);
        }
    }

    /**
     * Remove a director (mark as former)
     */
    public function destroy($id)
    {
        try {
            $directorHistory = DirectorHistory::findOrFail($id);

            if ($directorHistory->is_current) {
                return response()->json(['message' => 'Cannot remove current director'], 400);
            }

            $directorHistory->delete();

            return response()->json(['message' => 'Director history removed successfully']);
        } catch (\Exception $e) {
            Log::error('Error removing director history: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to remove director history'], 500);
        }
    }
}
