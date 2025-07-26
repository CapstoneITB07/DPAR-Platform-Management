<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Models\AssociateGroup;

class ProfileController extends Controller
{
    public function getProfile()
    {
        $user = Auth::user();
        $associateGroup = AssociateGroup::where('user_id', $user->id)->first();

        return response()->json([
            'name' => $user->name,
            'email' => $user->email,
            'organization' => $associateGroup ? $associateGroup->name : $user->organization,
            'logo' => $associateGroup ? $associateGroup->logo : null,
            'profile_picture_url' => $user->profile_picture ? asset('storage/' . $user->profile_picture) : null,
        ]);
    }

    public function updatePicture(Request $request)
    {
        $request->validate([
            'profile_picture' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        try {
            $user = Auth::user();
            /** @var \App\Models\User $user */

            if ($request->hasFile('profile_picture')) {
                // Delete old profile picture if exists
                if ($user->profile_picture && Storage::exists('public/' . $user->profile_picture)) {
                    Storage::delete('public/' . $user->profile_picture);
                }

                // Store new profile picture
                $path = $request->file('profile_picture')->store('profile_pictures', 'public');
                $user->profile_picture = $path;
                $user->save();

                // If user is an associate group leader, also update the associate group logo
                $associateGroup = AssociateGroup::where('user_id', $user->id)->first();
                if ($associateGroup) {
                    // Delete old logo if exists
                    if ($associateGroup->logo && Storage::exists('public/' . $associateGroup->logo)) {
                        Storage::delete('public/' . $associateGroup->logo);
                    }
                    $associateGroup->logo = $path;
                    $associateGroup->save();
                }

                return response()->json([
                    'message' => 'Profile picture updated successfully',
                    'profile_picture_url' => asset('storage/' . $path)
                ]);
            }

            return response()->json(['message' => 'No file uploaded'], 400);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update profile picture: ' . $e->getMessage()], 500);
        }
    }

    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . Auth::id(),
        ]);

        try {
            $user = Auth::user();
            /** @var \App\Models\User $user */
            $user->name = $request->name;
            $user->email = $request->email;
            $user->save();

            $associateGroup = AssociateGroup::where('user_id', $user->id)->first();
            if ($associateGroup && $request->has('organization')) {
                $associateGroup->name = $request->organization;
                $associateGroup->save();
            }

            return response()->json(['message' => 'Profile updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update profile: ' . $e->getMessage()], 500);
        }
    }
}
