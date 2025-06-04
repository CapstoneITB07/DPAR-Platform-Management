<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Announcement;
use Illuminate\Support\Facades\Storage;

class AnnouncementController extends Controller
{
    // Placeholder methods for resource controller
    public function index()
    {
        $announcements = Announcement::orderBy('created_at', 'desc')->get();
        foreach ($announcements as $a) {
            if ($a->photo_path) {
                $a->photo_url = asset('storage/' . $a->photo_path);
            } else {
                $a->photo_url = null;
            }
        }
        return $announcements;
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'photo' => 'nullable|image|max:5120', // max 5MB
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('announcements', 'public');
        }

        $announcement = Announcement::create([
            'title' => $data['title'] ?? null,
            'description' => $data['description'] ?? null,
            'photo_path' => $photoPath,
        ]);
        // Add photo_url to response
        if ($announcement->photo_path) {
            $announcement->photo_url = asset('storage/' . $announcement->photo_path);
        } else {
            $announcement->photo_url = null;
        }
        return response()->json($announcement, 201);
    }

    public function show(string $id)
    { /* TODO */
    }

    public function update(Request $request, string $id)
    {
        $announcement = Announcement::findOrFail($id);
        $data = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'photo' => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($announcement->photo_path && \Storage::disk('public')->exists($announcement->photo_path)) {
                \Storage::disk('public')->delete($announcement->photo_path);
            }
            $announcement->photo_path = $request->file('photo')->store('announcements', 'public');
        }
        $announcement->title = $data['title'] ?? $announcement->title;
        $announcement->description = $data['description'] ?? $announcement->description;
        $announcement->save();
        // Add photo_url to response
        $announcement->photo_url = $announcement->photo_path ? asset('storage/' . $announcement->photo_path) : null;
        return response()->json($announcement);
    }

    public function destroy(string $id)
    {
        $announcement = Announcement::findOrFail($id);
        // Delete photo if exists
        if ($announcement->photo_path && \Storage::disk('public')->exists($announcement->photo_path)) {
            \Storage::disk('public')->delete($announcement->photo_path);
        }
        $announcement->delete();
        return response()->json(['message' => 'Announcement deleted.']);
    }
}
