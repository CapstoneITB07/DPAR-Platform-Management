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
            if ($a->photos && is_array($a->photos)) {
                $a->photo_urls = array_map(function ($photoPath) {
                    return asset('storage/' . $photoPath);
                }, $a->photos);
            } else {
                $a->photo_urls = [];
            }
        }
        return $announcements;
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'photos.*' => 'nullable|image|max:5120', // max 5MB per photo
        ]);

        $photoPaths = [];
        if ($request->hasFile('photos')) {
            $photos = $request->file('photos');
            // Convert single file to array for consistent handling
            if (!is_array($photos)) {
                $photos = [$photos];
            }

            foreach ($photos as $photo) {
                if ($photo && $photo->isValid()) {
                    $photoPath = $photo->store('announcements', 'public');
                    $photoPaths[] = $photoPath;
                }
            }
        }

        $announcement = Announcement::create([
            'title' => $data['title'] ?? null,
            'description' => $data['description'] ?? null,
            'photos' => $photoPaths,
        ]);

        // Add photo_urls to response
        if (!empty($photoPaths)) {
            $announcement->photo_urls = array_map(function ($photoPath) {
                return asset('storage/' . $photoPath);
            }, $photoPaths);
        } else {
            $announcement->photo_urls = [];
        }

        return response()->json($announcement, 201);
    }

    public function update(Request $request, string $id)
    {
        $announcement = Announcement::findOrFail($id);
        $data = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'photos.*' => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('photos')) {
            // Delete old photos if they exist
            if ($announcement->photos && is_array($announcement->photos)) {
                foreach ($announcement->photos as $oldPhotoPath) {
                    if (Storage::disk('public')->exists($oldPhotoPath)) {
                        Storage::disk('public')->delete($oldPhotoPath);
                    }
                }
            }

            $photos = $request->file('photos');
            // Convert single file to array for consistent handling
            if (!is_array($photos)) {
                $photos = [$photos];
            }

            $photoPaths = [];
            foreach ($photos as $photo) {
                if ($photo && $photo->isValid()) {
                    $photoPath = $photo->store('announcements', 'public');
                    $photoPaths[] = $photoPath;
                }
            }
            $announcement->photos = $photoPaths;
        }

        $announcement->title = $data['title'] ?? $announcement->title;
        $announcement->description = $data['description'] ?? $announcement->description;
        $announcement->save();

        // Add photo_urls to response
        if ($announcement->photos && is_array($announcement->photos)) {
            $announcement->photo_urls = array_map(function ($photoPath) {
                return asset('storage/' . $photoPath);
            }, $announcement->photos);
        } else {
            $announcement->photo_urls = [];
        }

        return response()->json($announcement);
    }

    public function destroy(string $id)
    {
        $announcement = Announcement::findOrFail($id);
        // Delete photos if they exist
        if ($announcement->photos && is_array($announcement->photos)) {
            foreach ($announcement->photos as $photoPath) {
                if (Storage::disk('public')->exists($photoPath)) {
                    Storage::disk('public')->delete($photoPath);
                }
            }
        }
        $announcement->delete();
        return response()->json(['message' => 'Announcement deleted.']);
    }
}
