<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DirectorAchievement extends Model
{
    use HasFactory;

    protected $fillable = [
        'director_history_id',
        'title',
        'description',
        'achievement_type',
        'points_earned',
        'badge_icon',
        'badge_color',
        'is_milestone',
        'achieved_at'
    ];

    protected $casts = [
        'is_milestone' => 'boolean',
        'points_earned' => 'integer',
        'achieved_at' => 'datetime'
    ];

    /**
     * Get the director history that owns the achievement
     */
    public function directorHistory(): BelongsTo
    {
        return $this->belongsTo(DirectorHistory::class);
    }
}
