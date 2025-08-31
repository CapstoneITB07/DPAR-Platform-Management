<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TrainingProgram;
use Illuminate\Support\Facades\Storage;

class TrainingProgramController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $programs = TrainingProgram::orderBy('created_at', 'desc')->get();
        foreach ($programs as $p) {
            // Ensure photos is always an array and convert to full URLs
            if (!$p->photos) {
                $p->photos = [];
            } else {
                // Convert relative paths to full URLs for frontend
                $p->photos = array_map(function ($photoPath) {
                    return asset('storage/' . $photoPath);
                }, $p->photos);
            }
        }
        return $programs;
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'date' => 'required|date',
            'location' => 'required|string|max:255',
            'description' => 'required|string',
            'photos.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $data = $request->only(['name', 'date', 'location', 'description']);

        // Handle multiple photos
        $photoUrls = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $photo) {
                $path = $photo->store('training_programs', 'public');
                $photoUrls[] = $path; // Store relative path, not full URL
            }
        }

        if (!empty($photoUrls)) {
            $data['photos'] = $photoUrls;
        }

        $program = TrainingProgram::create($data);

        // Add photo_urls to response for consistency
        if (!empty($photoUrls)) {
            $program->photo_urls = array_map(function ($photoPath) {
                return asset('storage/' . $photoPath);
            }, $photoUrls);
        } else {
            $program->photo_urls = [];
        }

        return response()->json($program, 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $program = TrainingProgram::findOrFail($id);
        $request->validate([
            'name' => 'required|string|max:255',
            'date' => 'required|date',
            'location' => 'required|string|max:255',
            'description' => 'required|string',
            'photos.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Handle multiple photos
        if ($request->hasFile('photos')) {
            // Get existing photos to preserve them
            $existingPhotos = $program->photos ? $program->photos : [];

            // Add new photos to existing ones
            $photos = $request->file('photos');
            $newPhotoUrls = [];
            foreach ($photos as $photo) {
                $path = $photo->store('training_programs', 'public');
                $newPhotoUrls[] = $path; // Store relative path, not full URL
            }

            // Merge existing photos with new photos
            $program->photos = array_merge($existingPhotos, $newPhotoUrls);
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
                    $program->photos = $relativePaths;
                } else {
                    // If no photos to keep, remove all photos
                    if ($program->photos) {
                        foreach ($program->photos as $oldPhotoUrl) {
                            $oldPath = str_replace(asset('storage/'), '', $oldPhotoUrl);
                            if (Storage::disk('public')->exists($oldPath)) {
                                Storage::disk('public')->delete($oldPath);
                            }
                        }
                    }
                    $program->photos = null;
                }
            }
        }

        $program->name = $request->input('name');
        $program->date = $request->input('date');
        $program->location = $request->input('location');
        $program->description = $request->input('description');
        $program->save();

        // Add photo_urls to response for consistency
        if ($program->photos && is_array($program->photos)) {
            $program->photo_urls = array_map(function ($photoPath) {
                return asset('storage/' . $photoPath);
            }, $program->photos);
        } else {
            $program->photo_urls = [];
        }

        return response()->json($program);
    }

    /**
     * Remove the specified resource in storage.
     */
    public function destroy(string $id)
    {
        $program = TrainingProgram::findOrFail($id);

        // Delete photos
        if ($program->photos) {
            foreach ($program->photos as $photoUrl) {
                $path = str_replace(asset('storage/'), '', $photoUrl);
                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }
            }
        }

        $program->delete();
        return response()->json(['message' => 'Training program deleted.']);
    }
}
