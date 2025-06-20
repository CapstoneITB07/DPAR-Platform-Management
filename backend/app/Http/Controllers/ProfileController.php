<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Models\User;
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
            'organization' => $associateGroup ? $associateGroup->name : null,
            'logo' => $associateGroup ? $associateGroup->logo : null,
        ]);
    }

    public function updatePicture(Request $request)
    {
        $request->validate([
            'profile_picture' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        try {
            $user = Auth::user();
            $associateGroup = AssociateGroup::where('user_id', $user->id)->first();

            if (!$associateGroup) {
                return response()->json(['message' => 'Associate group not found'], 404);
            }

            if ($request->hasFile('profile_picture')) {
                // Delete old logo if exists
                if ($associateGroup->logo && Storage::exists('public/' . $associateGroup->logo)) {
                    Storage::delete('public/' . $associateGroup->logo);
                }

                // Store new logo
                $path = $request->file('profile_picture')->store('logos', 'public');
                $associateGroup->logo = $path;
                $associateGroup->save();

                return response()->json([
                    'message' => 'Profile picture updated successfully',
                    'logo' => Storage::url($path)
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
