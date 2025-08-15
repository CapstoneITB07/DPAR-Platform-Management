<?php

namespace App\Http\Controllers;

use App\Models\AssociateGroup;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AssociateGroupController extends Controller
{
    public function index()
    {
        try {
            $groups = AssociateGroup::with('user')->get();
            // Add full URLs for logos
            foreach ($groups as $group) {
                if ($group->logo && !str_starts_with($group->logo, '/Assets/')) {
                    $group->logo = Storage::url($group->logo);
                }
            }
            return response()->json($groups);
        } catch (\Exception $e) {
            Log::error('Error fetching associate groups: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch associate groups'], 500);
        }
    }

    public function publicIndex()
    {
        try {
            $groups = AssociateGroup::select('id', 'name', 'type', 'director', 'description', 'logo', 'email', 'phone')
                ->get();

            // Add full URLs for logos
            foreach ($groups as $group) {
                if ($group->logo && !str_starts_with($group->logo, '/Assets/')) {
                    $group->logo = Storage::url($group->logo);
                }
            }
            return response()->json($groups);
        } catch (\Exception $e) {
            Log::error('Error fetching public associate groups: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch associate groups'], 500);
        }
    }

    public function show($id)
    {
        try {
            $group = AssociateGroup::with('user')->findOrFail($id);
            // Add full URL for logos
            if ($group->logo && !str_starts_with($group->logo, '/Assets/')) {
                $group->logo = Storage::url($group->logo);
            }
            return response()->json($group);
        } catch (\Exception $e) {
            Log::error('Error fetching associate group: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch associate group'], 500);
        }
    }

    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'type' => 'nullable|string|max:255',
                'director' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
                'email' => 'required|email|unique:users,email',
                'phone' => ['required', 'string', 'size:11', 'regex:/^09[0-9]{9}$/'],
                'password' => 'required|string|min:8|confirmed',
            ], [
                'name.required' => 'Organization name is required.',
                'email.required' => 'Email address is required.',
                'email.email' => 'Please enter a valid email address.',
                'email.unique' => 'This email is already used by another associate group.',
                'phone.required' => 'Phone number is required.',
                'phone.size' => 'Phone number must be exactly 11 digits.',
                'phone.regex' => 'Phone number must start with 09 and contain only numbers.',
                'logo.required' => 'Logo is required for new associate groups.',
                'logo.image' => 'Logo must be a valid image file.',
                'logo.mimes' => 'Logo must be in JPEG, PNG, JPG, or GIF format.',
                'logo.max' => 'Logo file size must not exceed 2MB.',
                'password.required' => 'Password is required.',
                'password.min' => 'Password must be at least 8 characters long.',
                'password.confirmed' => 'Password confirmation does not match.',
            ]);

            // Create user account
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'associate_group_leader',
                'organization' => $request->name,
            ]);

            // Handle logo upload
            $logoPath = '/Assets/disaster_logo.png';  // Set default logo path
            if ($request->hasFile('logo')) {
                $path = $request->file('logo')->store('logos', 'public');
                $logoPath = $path;

                // Update user's profile picture to match the logo
                $user->update(['profile_picture' => $path]);
            }

            $group = AssociateGroup::create([
                'user_id' => $user->id,
                'name' => $request->name,
                'type' => $request->type,
                'director' => $request->director,
                'description' => $request->description,
                'logo' => $logoPath,
                'email' => $request->email,
                'phone' => $request->phone,
            ]);

            // Return the group with the full logo URL for immediate display
            $group = $group->fresh();
            if ($group->logo && !str_starts_with($group->logo, '/Assets/')) {
                $group->logo = Storage::url($group->logo);
            }

            DB::commit();
            return response()->json($group->load('user'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating associate group: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to create associate group',
                'error' => $e->getMessage()
            ], 422);
        }
    }

    public function update(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $group = AssociateGroup::with('user')->findOrFail($id);

            // Separate validation rules for with and without logo
            $validationRules = [
                'name' => 'required|string|max:255',
                'type' => 'nullable|string|max:255',
                'director' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'email' => 'required|email|unique:users,email,' . $group->user_id,
                'phone' => ['required', 'string', 'size:11', 'regex:/^09[0-9]{9}$/'],
            ];

            $customMessages = [
                'name.required' => 'Organization name is required.',
                'email.required' => 'Email address is required.',
                'email.email' => 'Please enter a valid email address.',
                'email.unique' => 'This email is already used by another associate group.',
                'phone.required' => 'Phone number is required.',
                'phone.size' => 'Phone number must be exactly 11 digits.',
                'phone.regex' => 'Phone number must start with 09 and contain only numbers.',
            ];

            // Add logo validation only if a file is being uploaded
            if ($request->hasFile('logo')) {
                $validationRules['logo'] = 'image|mimes:jpeg,png,jpg,gif|max:2048';
                $customMessages['logo.image'] = 'Logo must be a valid image file.';
                $customMessages['logo.mimes'] = 'Logo must be in JPEG, PNG, JPG, or GIF format.';
                $customMessages['logo.max'] = 'Logo file size must not exceed 2MB.';
            }

            // Use explicit field access instead of $request->all() for PUT requests
            $validated = $request->validate($validationRules, $customMessages);

            // Explicitly get the validated data
            $validatedData = [
                'name' => $request->input('name'),
                'type' => $request->input('type'),
                'director' => $request->input('director'),
                'description' => $request->input('description'),
                'email' => $request->input('email'),
                'phone' => $request->input('phone')
            ];

            // Update user account if it exists
            if ($group->user) {
                $group->user->update([
                    'name' => $validatedData['name'],
                    'email' => $validatedData['email'],
                    'organization' => $validatedData['name'],
                ]);
            }

            // Handle logo upload if a new file is provided
            if ($request->hasFile('logo')) {
                try {
                    // Delete old logo if it exists and is not a default Asset
                    if ($group->logo && !str_starts_with($group->logo, '/Assets/')) {
                        Storage::delete('public/' . $group->logo);
                    }

                    $path = $request->file('logo')->store('logos', 'public');
                    $group->logo = $path;

                    // Update user's profile picture to match the logo
                    if ($group->user) {
                        $group->user->update(['profile_picture' => $path]);
                    }
                } catch (\Exception $e) {
                    Log::error('Error handling logo upload: ' . $e->getMessage());
                    throw new \Exception('Failed to process logo upload: ' . $e->getMessage());
                }
            }

            // Update group details
            $updateData = [
                'name' => $validatedData['name'],
                'type' => $validatedData['type'] ?? $group->type,
                'director' => $validatedData['director'] ?? $group->director,
                'description' => $validatedData['description'] ?? $group->description,
                'email' => $validatedData['email'],
                'phone' => $validatedData['phone'],
            ];

            $group->update($updateData);

            // Refresh the model to get the latest data
            $group = $group->fresh('user');

            // Format logo URL for response
            if ($group->logo && !str_starts_with($group->logo, '/Assets/')) {
                $group->logo = Storage::url($group->logo);
            }

            DB::commit();
            return response()->json($group);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            Log::error('Validation error updating associate group: ' . json_encode($e->errors()));
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating associate group: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update associate group',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $group = AssociateGroup::with('user')->findOrFail($id);

            // Delete logo if exists
            if ($group->logo) {
                $oldPath = str_replace('/storage/', '', $group->logo);
                Storage::disk('public')->delete($oldPath);
            }

            // Delete associated user
            if ($group->user) {
                $group->user->delete();
            }

            $group->delete();

            DB::commit();
            return response()->json(['message' => 'Associate group deleted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting associate group: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete associate group',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
