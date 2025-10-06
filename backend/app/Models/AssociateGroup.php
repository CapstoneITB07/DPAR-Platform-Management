<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AssociateGroup extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'type',
        'director',
        'description',
        'logo',
        'email',
        'phone',
        'user_id',
        'members',
        'date_joined'
    ];

    protected $appends = ['members_count'];


    public function getMembersCountAttribute()
    {
        return $this->volunteers()->count();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function volunteers()
    {
        return $this->hasMany(Volunteer::class);
    }

    /**
     * Get the director history for this associate group
     */
    public function directorHistories()
    {
        return $this->hasMany(DirectorHistory::class);
    }

    /**
     * Get the current director history
     */
    public function currentDirector()
    {
        return $this->hasOne(DirectorHistory::class)->where('is_current', true);
    }

    /**
     * Get director history with activities
     */
    public function directorHistoriesWithActivities()
    {
        return $this->hasMany(DirectorHistory::class)
            ->with([
                'achievements',
                'activityLogs' => function ($query) {
                    $query->orderBy('activity_at', 'desc')->limit(10);
                }
            ])
            ->orderBy('start_date', 'desc');
    }
}
