<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'activity_type',
        'description',
        'metadata',
        'activity_at'
    ];

    protected $casts = [
        'metadata' => 'array',
        'activity_at' => 'datetime'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Log a user activity
     */
    public static function logActivity($userId, $activityType, $description = null, $metadata = null)
    {
        return self::create([
            'user_id' => $userId,
            'activity_type' => $activityType,
            'description' => $description,
            'metadata' => $metadata,
            'activity_at' => now()
        ]);
    }

    /**
     * Get active users within a time period
     */
    public static function getActiveUsers($period = 'day')
    {
        $timeAgo = now();

        switch ($period) {
            case 'day':
                $timeAgo = now()->subDay();
                break;
            case 'week':
                $timeAgo = now()->subWeek();
                break;
            case 'month':
                $timeAgo = now()->subMonth();
                break;
            default:
                $timeAgo = now()->subDay();
        }

        $query = self::select('user_id')
            ->distinct()
            ->where('activity_at', '>=', $timeAgo);

        return $query->pluck('user_id');
    }

    /**
     * Check if user is active within a time period
     */
    public static function isUserActive($userId, $period = 'day')
    {
        $timeAgo = now();

        switch ($period) {
            case 'day':
                $timeAgo = now()->subDay();
                break;
            case 'week':
                $timeAgo = now()->subWeek();
                break;
            case 'month':
                $timeAgo = now()->subMonth();
                break;
            default:
                $timeAgo = now()->subDay();
        }

        return self::where('user_id', $userId)
            ->where('activity_at', '>=', $timeAgo)
            ->exists();
    }

    /**
     * Get user's last activity
     */
    public static function getLastActivity($userId)
    {
        return self::where('user_id', $userId)
            ->orderBy('activity_at', 'desc')
            ->first();
    }
}
