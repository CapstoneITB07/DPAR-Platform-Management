<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CitizenAnalytics extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_path',
        'content_type',
        'content_id',
        'ip_address',
        'user_agent',
        'referrer',
        'viewed_at'
    ];

    protected $casts = [
        'viewed_at' => 'datetime'
    ];

    /**
     * Track a page view
     */
    public static function trackView($pagePath, $contentType = null, $contentId = null)
    {
        return self::create([
            'page_path' => $pagePath,
            'content_type' => $contentType,
            'content_id' => $contentId,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'referrer' => request()->header('referer'),
            'viewed_at' => now()
        ]);
    }

    /**
     * Get page views for a specific path
     */
    public static function getPageViews($pagePath, $days = 30)
    {
        return self::where('page_path', $pagePath)
            ->where('viewed_at', '>=', now()->subDays($days))
            ->count();
    }

    /**
     * Get content views
     */
    public static function getContentViews($contentType, $contentId, $days = 30)
    {
        return self::where('content_type', $contentType)
            ->where('content_id', $contentId)
            ->where('viewed_at', '>=', now()->subDays($days))
            ->count();
    }
}

