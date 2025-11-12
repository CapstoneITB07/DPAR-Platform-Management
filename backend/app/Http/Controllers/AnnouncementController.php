<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Announcement;
use App\Models\ActivityLog;
use App\Models\DirectorHistory;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use App\Services\PushNotificationService;

class AnnouncementController extends Controller
{
    // Placeholder methods for resource controller
    public function index()
    {
        // For public API, only show visible announcements
        $announcements = Announcement::where('visible_to_citizens', true)
            ->orderBy('featured', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
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

        // Log activity for announcement creation
        if (Auth::check()) {
            try {
                $user = Auth::user();
                $directorHistoryId = null;
                if ($user->role === 'associate_group_leader') {
                    $directorHistoryId = DirectorHistory::getCurrentDirectorHistoryId($user->id);
                }
                ActivityLog::logActivity(
                    $user->id,
                    'create',
                    'Created announcement: ' . ($announcement->title ?? 'Untitled'),
                    [
                        'announcement_id' => $announcement->id,
                        'announcement_title' => $announcement->title
                    ],
                    $directorHistoryId
                );
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to log announcement creation activity: ' . $e->getMessage());
            }
        }

        // Add photo_urls to response
        if (!empty($photoPaths)) {
            $announcement->photo_urls = array_map(function ($photoPath) {
                return asset('storage/' . $photoPath);
            }, $photoPaths);
        } else {
            $announcement->photo_urls = [];
        }

        // Send push notifications for new announcement
        try {
            PushNotificationService::notifyAssociatesNewAnnouncement($announcement);
            PushNotificationService::notifyCitizensNewAnnouncement($announcement);
        } catch (\Exception $e) {
            // Log error but don't fail the announcement creation
            \Illuminate\Support\Facades\Log::error('Failed to send announcement push notifications: ' . $e->getMessage());
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

        // Handle multiple photos
        if ($request->hasFile('photos')) {
            // Get existing photos to preserve them
            $existingPhotos = $announcement->photos ? $announcement->photos : [];

            // Add new photos to existing ones
            $photos = $request->file('photos');
            // Convert single file to array for consistent handling
            if (!is_array($photos)) {
                $photos = [$photos];
            }

            $newPhotoPaths = [];
            foreach ($photos as $photo) {
                if ($photo && $photo->isValid()) {
                    $photoPath = $photo->store('announcements', 'public');
                    $newPhotoPaths[] = $photoPath;
                }
            }

            // Merge existing photos with new photos
            $announcement->photos = array_merge($existingPhotos, $newPhotoPaths);
        } else {
            // Handle existing photos - keep only the ones that weren't removed
            if ($request->has('keep_existing_photos')) {
                $keepPhotos = json_decode($request->input('keep_existing_photos'), true);
                if (is_array($keepPhotos)) {
                    // Convert full URLs back to relative paths for storage
                    $relativePaths = [];
                    foreach ($keepPhotos as $photoUrl) {
                        if (str_starts_with($photoUrl, asset('storage/'))) {
                            // Extract relative path from full URL
                            $relativePath = str_replace(asset('storage/'), '', $photoUrl);
                            $relativePaths[] = $relativePath;
                        } else {
                            // If it's already a relative path, keep it as is
                            $relativePaths[] = $photoUrl;
                        }
                    }
                    $announcement->photos = $relativePaths;
                } else {
                    // If no photos to keep, remove all photos
                    if ($announcement->photos) {
                        foreach ($announcement->photos as $oldPhotoPath) {
                            if (Storage::disk('public')->exists($oldPhotoPath)) {
                                Storage::disk('public')->delete($oldPhotoPath);
                            }
                        }
                    }
                    $announcement->photos = null;
                }
            }
        }

        $announcement->title = $data['title'] ?? $announcement->title;
        $announcement->description = $data['description'] ?? $announcement->description;
        $announcement->save();

        // Log activity for announcement update
        if (Auth::check()) {
            try {
                $user = Auth::user();
                $directorHistoryId = null;
                if ($user->role === 'associate_group_leader') {
                    $directorHistoryId = DirectorHistory::getCurrentDirectorHistoryId($user->id);
                }
                ActivityLog::logActivity(
                    $user->id,
                    'update',
                    'Updated announcement: ' . ($announcement->title ?? 'Untitled'),
                    [
                        'announcement_id' => $announcement->id,
                        'announcement_title' => $announcement->title
                    ],
                    $directorHistoryId
                );
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to log announcement update activity: ' . $e->getMessage());
            }
        }

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
        $announcementTitle = $announcement->title ?? 'Untitled';
        $announcement->delete();

        // Log activity for announcement deletion
        if (Auth::check()) {
            try {
                $user = Auth::user();
                $directorHistoryId = null;
                if ($user->role === 'associate_group_leader') {
                    $directorHistoryId = DirectorHistory::getCurrentDirectorHistoryId($user->id);
                }
                ActivityLog::logActivity(
                    $user->id,
                    'delete',
                    'Deleted announcement: ' . $announcementTitle,
                    [
                        'announcement_id' => $id,
                        'announcement_title' => $announcementTitle
                    ],
                    $directorHistoryId
                );
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to log announcement deletion activity: ' . $e->getMessage());
            }
        }

        return response()->json(['message' => 'Announcement deleted.']);
    }
}
