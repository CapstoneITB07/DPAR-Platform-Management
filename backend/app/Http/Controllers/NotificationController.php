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
        try {
            $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'expertise_requirements' => 'required|array|min:1',
                'expertise_requirements.*.expertise' => 'required|string|max:255',
                'expertise_requirements.*.count' => 'required|integer|min:1',
                'associate_ids' => 'nullable|array', // If null, send to all associates
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed', ['errors' => $e->errors()]);
            return response()->json(['error' => 'Validation failed', 'details' => $e->errors()], 422);
        }

        $user = $request->user();
        DB::beginTransaction();
        try {
            Log::info('Creating notification', [
                'title' => $request->title,
                'expertise_requirements' => $request->expertise_requirements,
                'associate_ids' => $request->associate_ids
            ]);
            
            $notification = Notification::create([
                'title' => $request->title,
                'description' => $request->description,
                'created_by' => $user->id,
                'expertise_requirements' => $request->expertise_requirements,
            ]);

            // Get associate group leaders
            $query = User::where('role', 'associate_group_leader');
            if ($request->associate_ids && !empty($request->associate_ids)) {
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
            Log::error('Notification creation failed: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Failed to create notification', 
                'details' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
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
        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'expertise_requirements' => 'required|array|min:1',
            'expertise_requirements.*.expertise' => 'required|string|max:255',
            'expertise_requirements.*.count' => 'required|integer|min:1',
        ]);
        
        $notification = Notification::findOrFail($id);
        $notification->update($request->only(['title', 'description', 'expertise_requirements']));
        return response()->json(['message' => 'Notification updated.', 'notification' => $notification]);
    }

    // Delete a notification (admin only)
    public function destroy($id)
    {
        $notification = Notification::findOrFail($id);
        $notification->delete();
        return response()->json(['message' => 'Notification deleted.']);
    }

    // Associate responds to a notification with volunteer selections
    public function respond(Request $request, $id)
    {
        $request->validate([
            'response' => 'required|in:accept,decline',
            'volunteer_selections' => 'nullable|array',
            'volunteer_selections.*.expertise' => 'required_with:volunteer_selections|string|max:255',
            'volunteer_selections.*.count' => 'required_with:volunteer_selections|integer|min:1',
        ]);
        
        $user = $request->user();
        $notification = Notification::with('recipients.user')->findOrFail($id);
        $recipient = NotificationRecipient::where('notification_id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();
        
        // If accepting, validate volunteer selections against available capacity
        if ($request->response === 'accept' && $request->volunteer_selections) {
            $errors = [];
            
            // Calculate current progress for each expertise
            $currentProgress = [];
            foreach ($notification->expertise_requirements as $requirement) {
                $expertise = $requirement['expertise'];
                $required = $requirement['count'];
                $currentProgress[$expertise] = [
                    'required' => $required,
                    'provided' => 0,
                    'remaining' => $required
                ];
            }
            
            // Calculate what's already been provided by other associates
            foreach ($notification->recipients as $otherRecipient) {
                if ($otherRecipient->user_id !== $user->id && 
                    $otherRecipient->response === 'accept' && 
                    $otherRecipient->volunteer_selections) {
                    
                    foreach ($otherRecipient->volunteer_selections as $selection) {
                        $expertise = $selection['expertise'];
                        $count = $selection['count'];
                        
                        if (isset($currentProgress[$expertise])) {
                            $currentProgress[$expertise]['provided'] += $count;
                            $currentProgress[$expertise]['remaining'] = max(0, $currentProgress[$expertise]['required'] - $currentProgress[$expertise]['provided']);
                        }
                    }
                }
            }
            
            // Validate the new selections
            foreach ($request->volunteer_selections as $selection) {
                $expertise = $selection['expertise'];
                $requestedCount = $selection['count'];
                
                if (isset($currentProgress[$expertise])) {
                    $available = $currentProgress[$expertise]['remaining'];
                    
                    if ($requestedCount > $available) {
                        $errors[] = "Cannot provide {$requestedCount} {$expertise} volunteers. Only {$available} remaining.";
                    }
                }
            }
            
            if (!empty($errors)) {
                return response()->json([
                    'error' => 'Validation failed',
                    'details' => $errors
                ], 422);
            }
        }
            
        $recipient->update([
            'response' => $request->response,
            'volunteer_selections' => $request->volunteer_selections,
            'responded_at' => now(),
        ]);
        
        return response()->json(['message' => 'Response recorded.']);
    }

    // Get volunteer progress for a notification
    public function getVolunteerProgress($id)
    {
        $notification = Notification::with('recipients.user')->findOrFail($id);
        
        if (!$notification->expertise_requirements) {
            return response()->json(['progress' => []]);
        }
        
        $progress = [];
        $totalProgress = [];
        
        // Initialize progress tracking for each expertise requirement
        foreach ($notification->expertise_requirements as $requirement) {
            $expertise = $requirement['expertise'];
            $required = $requirement['count'];
            $progress[$expertise] = [
                'required' => $required,
                'provided' => 0,
                'remaining' => $required,
                'groups' => []
            ];
        }
        
        // Calculate progress from responses
        foreach ($notification->recipients as $recipient) {
            if ($recipient->response === 'accept' && $recipient->volunteer_selections) {
                foreach ($recipient->volunteer_selections as $selection) {
                    $expertise = $selection['expertise'];
                    $count = $selection['count'];
                    
                    if (isset($progress[$expertise])) {
                        // Cap the provided count to not exceed required
                        $currentProvided = $progress[$expertise]['provided'];
                        $maxAllowed = $progress[$expertise]['required'] - $currentProvided;
                        $actualCount = min($count, $maxAllowed);
                        
                        if ($actualCount > 0) {
                            $progress[$expertise]['provided'] += $actualCount;
                            $progress[$expertise]['remaining'] = max(0, $progress[$expertise]['required'] - $progress[$expertise]['provided']);
                            
                            // Track which group provided these volunteers
                            $groupName = $recipient->user ? $recipient->user->name : 'Unknown Group';
                            $progress[$expertise]['groups'][] = [
                                'group' => $groupName,
                                'count' => $actualCount
                            ];
                        }
                    }
                }
            }
        }
        
        return response()->json(['progress' => $progress]);
    }

    // Get current available capacity for a specific notification (for associates)
    public function getAvailableCapacity($id, Request $request)
    {
        $notification = Notification::with('recipients.user')->findOrFail($id);
        $currentUser = $request->user();
        
        if (!$notification->expertise_requirements) {
            return response()->json(['available' => []]);
        }
        
        $available = [];
        
        // Initialize available capacity for each expertise requirement
        foreach ($notification->expertise_requirements as $requirement) {
            $expertise = $requirement['expertise'];
            $required = $requirement['count'];
            $available[$expertise] = [
                'required' => $required,
                'provided' => 0,
                'remaining' => $required
            ];
        }
        
        // Calculate what's already been provided by OTHER associates (excluding current user)
        foreach ($notification->recipients as $recipient) {
            if ($recipient->user_id !== $currentUser->id && 
                $recipient->response === 'accept' && 
                $recipient->volunteer_selections) {
                
                foreach ($recipient->volunteer_selections as $selection) {
                    $expertise = $selection['expertise'];
                    $count = $selection['count'];
                    
                    if (isset($available[$expertise])) {
                        // Cap the provided count to not exceed required
                        $currentProvided = $available[$expertise]['provided'];
                        $maxAllowed = $available[$expertise]['required'] - $currentProvided;
                        $actualCount = min($count, $maxAllowed);
                        
                        if ($actualCount > 0) {
                            $available[$expertise]['provided'] += $actualCount;
                            $available[$expertise]['remaining'] = max(0, $available[$expertise]['required'] - $available[$expertise]['provided']);
                        }
                    }
                }
            }
        }
        
        return response()->json(['available' => $available]);
    }
}
