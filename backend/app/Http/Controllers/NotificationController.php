<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    // List all notifications (admin view)
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->role === 'head_admin') {
            $notifications = Notification::with('recipients.user')->orderBy('created_at', 'desc')->get();
        } else {
            // For associates, only show notifications assigned to them, but load all recipients for progress
            $notifications = Notification::whereHas('recipients', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->with('recipients.user')->orderBy('created_at', 'desc')->get();
        }
        return response()->json($notifications);
    }

    // Create a new notification and assign to associates
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'volunteers_needed' => 'nullable|integer',
            'associate_ids' => 'nullable|array', // If null, send to all associates
        ]);

        $user = $request->user();
        DB::beginTransaction();
        try {
            $volunteersNeeded = $request->volunteers_needed !== null ? (int)$request->volunteers_needed : null;
            $notification = Notification::create([
                'title' => $request->title,
                'description' => $request->description,
                'created_by' => $user->id,
                'volunteers_needed' => $volunteersNeeded,
            ]);

            // Get associate group leaders
            $query = User::where('role', 'associate_group_leader');
            if ($request->associate_ids) {
                $query->whereIn('id', $request->associate_ids);
            }
            $associates = $query->get();

            foreach ($associates as $associate) {
                NotificationRecipient::create([
                    'notification_id' => $notification->id,
                    'user_id' => $associate->id,
                ]);
            }
            DB::commit();
            return response()->json(['message' => 'Notification created and sent.', 'notification' => $notification], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Notification creation failed: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'Failed to create notification', 'details' => $e->getMessage()], 500);
        }
    }

    // Show a single notification with recipients and progress
    public function show($id, Request $request)
    {
        $notification = Notification::with('recipients.user')->findOrFail($id);
        $total = $notification->recipients->count();
        $responded = $notification->recipients->whereNotNull('response')->count();
        $progress = $total > 0 ? round(($responded / $total) * 100) : 0;
        return response()->json([
            'notification' => $notification,
            'progress' => $progress,
        ]);
    }

    // Update a notification (admin only)
    public function update(Request $request, $id)
    {
        $notification = Notification::findOrFail($id);
        $notification->update($request->only(['title', 'description', 'volunteers_needed']));
        return response()->json(['message' => 'Notification updated.', 'notification' => $notification]);
    }

    // Delete a notification (admin only)
    public function destroy($id)
    {
        $notification = Notification::findOrFail($id);
        $notification->delete();
        return response()->json(['message' => 'Notification deleted.']);
    }

    // Associate responds to a notification
    public function respond(Request $request, $id)
    {
        $request->validate([
            'response' => 'required|in:accept,decline',
        ]);
        $user = $request->user();
        $recipient = NotificationRecipient::where('notification_id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();
        $recipient->update([
            'response' => $request->response,
            'responded_at' => now(),
        ]);
        return response()->json(['message' => 'Response recorded.']);
    }
}
