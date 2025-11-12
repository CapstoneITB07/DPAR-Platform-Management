<?php

namespace App\Http\Controllers;

use App\Models\CalendarEvent;
use App\Models\ActivityLog;
use App\Models\DirectorHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CalendarEventController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $events = CalendarEvent::with('creator')->orderBy('start_date', 'asc')->get();

            return response()->json([
                'success' => true,
                'data' => $events
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch events: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'location' => 'nullable|string|max:255',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after:start_date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $event = CalendarEvent::create([
                'title' => $request->title,
                'description' => $request->description,
                'location' => $request->location,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'created_by' => Auth::id(),
            ]);

            // Log activity for event creation (for associate group leaders and head admins)
            $user = Auth::user();
            if ($user && in_array($user->role, ['associate_group_leader', 'head_admin'])) {
                $directorHistoryId = $user->role === 'associate_group_leader' 
                    ? DirectorHistory::getCurrentDirectorHistoryId($user->id) 
                    : null;
                ActivityLog::logActivity(
                    $user->id,
                    'create',
                    'Created a new event: ' . $event->title,
                    [
                        'event_id' => $event->id,
                        'event_title' => $event->title,
                        'event_location' => $event->location,
                        'start_date' => $event->start_date,
                        'end_date' => $event->end_date,
                        'resource_type' => 'calendar_event'
                    ],
                    $directorHistoryId
                );
            }

            $event->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Event created successfully',
                'data' => $event
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create event: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(CalendarEvent $calendarEvent)
    {
        try {
            $calendarEvent->load('creator');

            return response()->json([
                'success' => true,
                'data' => $calendarEvent
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch event: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, CalendarEvent $calendarEvent)
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'location' => 'nullable|string|max:255',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after:start_date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $calendarEvent->update([
                'title' => $request->title,
                'description' => $request->description,
                'location' => $request->location,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
            ]);

            // Log activity for event update (for associate group leaders and head admins)
            $user = Auth::user();
            if ($user && in_array($user->role, ['associate_group_leader', 'head_admin'])) {
                $directorHistoryId = $user->role === 'associate_group_leader' 
                    ? DirectorHistory::getCurrentDirectorHistoryId($user->id) 
                    : null;
                ActivityLog::logActivity(
                    $user->id,
                    'update',
                    'Updated event: ' . $calendarEvent->title,
                    [
                        'event_id' => $calendarEvent->id,
                        'event_title' => $calendarEvent->title,
                        'event_location' => $calendarEvent->location,
                        'start_date' => $calendarEvent->start_date,
                        'end_date' => $calendarEvent->end_date,
                        'resource_type' => 'calendar_event'
                    ],
                    $directorHistoryId
                );
            }

            $calendarEvent->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Event updated successfully',
                'data' => $calendarEvent
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update event: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(CalendarEvent $calendarEvent)
    {
        try {
            $eventTitle = $calendarEvent->title;
            $eventId = $calendarEvent->id;
            
            $calendarEvent->delete();

            // Log activity for event deletion (for associate group leaders and head admins)
            $user = Auth::user();
            if ($user && in_array($user->role, ['associate_group_leader', 'head_admin'])) {
                $directorHistoryId = $user->role === 'associate_group_leader' 
                    ? DirectorHistory::getCurrentDirectorHistoryId($user->id) 
                    : null;
                ActivityLog::logActivity(
                    $user->id,
                    'delete',
                    'Deleted event: ' . $eventTitle,
                    [
                        'event_id' => $eventId,
                        'event_title' => $eventTitle,
                        'resource_type' => 'calendar_event'
                    ],
                    $directorHistoryId
                );
            }

            return response()->json([
                'success' => true,
                'message' => 'Event deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete event: ' . $e->getMessage()
            ], 500);
        }
    }
}
