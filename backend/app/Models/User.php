<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Model;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'organization',
        'profile_picture',
        'temp_password',
        'recovery_passcodes',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'temp_password', // Hide temp_password from API responses
        'recovery_passcodes', // Hide recovery_passcodes from API responses
    ];

    protected $appends = ['photo_url'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'recovery_passcodes' => 'array',
    ];

    protected static function booted()
    {
        // When user is updated, sync changes to associate group if applicable
        static::updated(function ($user) {
            if ($user->wasChanged('name') && $user->role === 'associate_group_leader') {
                $associateGroup = \App\Models\AssociateGroup::where('user_id', $user->id)->first();
                if ($associateGroup) {
                    $associateGroup->update(['name' => $user->name]);
                }
            }
        });
    }

    public function getPhotoUrlAttribute()
    {
        return $this->profile_picture ? asset('storage/' . $this->profile_picture) : null;
    }
}
