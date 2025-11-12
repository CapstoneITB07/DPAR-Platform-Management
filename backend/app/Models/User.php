<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Notification;
use App\Models\Report;
use App\Models\ActivityLog;
use App\Models\Volunteer;
use App\Models\AssociateGroup;
use App\Models\CalendarEvent;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'role',
        'organization',
        'profile_picture',
        'temp_password',
        'recovery_passcodes',
        'needs_otp_verification',
        'email_verification_otp',
        'email_verification_otp_expires_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'temp_password', // Hide temp_password from API responses
        'recovery_passcodes', // Hide recovery_passcodes from API responses
        'email_verification_otp', // Hide email verification OTP from API responses
    ];

    protected $appends = ['photo_url'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'recovery_passcodes' => 'array',
        'needs_otp_verification' => 'boolean',
        'email_verification_otp_expires_at' => 'datetime',
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

    /**
     * Get the notifications created by this user
     */
    public function notifications()
    {
        return $this->hasMany(Notification::class, 'created_by');
    }

    /**
     * Get the reports submitted by this user
     */
    public function reports()
    {
        return $this->hasMany(Report::class, 'user_id');
    }

    /**
     * Get the activity logs for this user
     */
    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    /**
     * Get the volunteers for this user's associate group
     */
    public function volunteers()
    {
        return $this->hasManyThrough(Volunteer::class, AssociateGroup::class, 'user_id', 'associate_group_id');
    }

    /**
     * Get the calendar events created by this user
     */
    public function calendarEvents()
    {
        return $this->hasMany(CalendarEvent::class, 'created_by');
    }

    /**
     * Get the associate group for this user
     */
    public function associateGroup()
    {
        return $this->hasOne(AssociateGroup::class);
    }
}
