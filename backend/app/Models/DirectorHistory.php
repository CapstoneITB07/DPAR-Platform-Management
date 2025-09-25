<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Log;

class DirectorHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'associate_group_id',
        'director_name',
        'director_email',
        'contributions',
        'volunteers_recruited',
        'reports_submitted',
        'notifications_responded',
        'logins',
        'start_date',
        'end_date',
        'is_current'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_current' => 'boolean',
        'volunteers_recruited' => 'integer',
        'reports_submitted' => 'integer',
        'notifications_responded' => 'integer',
        'logins' => 'integer'
    ];

    protected $appends = [
        'notifications_created',
        'notification_activities_count',
        'reports_submitted_count',
        'total_activities',
        'login_activities_count',
        'system_engagement_score',
        'activity_logs',
        'actual_volunteer_count'
    ];

    /**
     * Get the associate group that owns the director history
     */
    public function associateGroup(): BelongsTo
    {
        return $this->belongsTo(AssociateGroup::class);
    }

    /**
     * Get the user associated with this director (if any)
     */
    public function user()
    {
        // Get the user from the associate group
        $associateGroup = $this->associateGroup;
        if (!$associateGroup) {
            Log::info('DirectorHistory: No associate group found for director history ID: ' . $this->id);
            return null;
        }

        $user = $associateGroup->user;
        if (!$user) {
            Log::info('DirectorHistory: No user found in associate group for director history ID: ' . $this->id);
            return null;
        }

        return $user;
    }

    /**
     * Get the activity logs for this director during their tenure
     */
    public function activityLogs()
    {
        // Now we can directly get activities by director_history_id
        return $this->hasMany(ActivityLog::class);
    }

    /**
     * Get the achievements for this director
     */
    public function achievements(): HasMany
    {
        return $this->hasMany(DirectorAchievement::class);
    }

    /**
     * Get the reports created by this director during their tenure
     */
    public function reports(): HasMany
    {
        $query = $this->hasMany(Report::class, 'user_id', 'user_id');

        // Filter reports by director's tenure period
        if ($this->start_date) {
            $query->where('created_at', '>=', $this->start_date);
        }
        if ($this->end_date) {
            $query->where('created_at', '<=', $this->end_date);
        }

        return $query;
    }

    /**
     * Get the notifications created by this director during their tenure
     */
    public function notifications(): HasMany
    {
        $query = $this->hasMany(Notification::class, 'user_id', 'user_id');

        // Filter notifications by director's tenure period
        if ($this->start_date) {
            $query->where('created_at', '>=', $this->start_date);
        }
        if ($this->end_date) {
            $query->where('created_at', '<=', $this->end_date);
        }

        return $query;
    }

    /**
     * Get the volunteers recruited by this director during their tenure
     */
    public function recruitedVolunteers(): HasMany
    {
        $query = $this->hasMany(Volunteer::class, 'recruited_by_director_id');

        // Filter volunteers by director's tenure period
        if ($this->start_date) {
            $query->where('created_at', '>=', $this->start_date . ' 00:00:00');
        }
        if ($this->end_date) {
            $query->where('created_at', '<=', $this->end_date . ' 23:59:59');
        } else {
            // For current director, only count volunteers from their start date onwards
            $query->where('created_at', '>=', $this->start_date . ' 00:00:00');
        }

        return $query;
    }

    /**
     * Get director activity summary during their tenure
     */
    public function getActivitySummary()
    {
        $user = $this->user();
        if (!$user) {
            return [
                'total_activities' => 0,
                'last_activity' => null,
                'notifications_created' => 0,
                'reports_submitted' => 0,
                'volunteers_recruited' => $this->volunteers_recruited,
                'events_organized' => $this->events_organized,
                'system_engagement_score' => 0
            ];
        }

        // Use the date-filtered methods
        $notificationsCount = $this->getNotificationsCreatedAttribute();
        $reportsCount = $this->getReportsSubmittedCountAttribute();
        $activitiesCount = $this->getTotalActivitiesAttribute();

        // Get last activity within tenure period
        $lastActivityQuery = $user->activityLogs();
        if ($this->start_date) {
            $lastActivityQuery->where('activity_at', '>=', $this->start_date);
        }
        if ($this->end_date) {
            $lastActivityQuery->where('activity_at', '<=', $this->end_date);
        }
        $lastActivity = $lastActivityQuery->latest('activity_at')->first();

        // Calculate system engagement score based on various activities
        $engagementScore = min(
            100,
            ($notificationsCount * 10) +
                ($reportsCount * 15) +
                ($activitiesCount * 5) +
                ($this->volunteers_recruited * 20) +
                ($this->events_organized * 25)
        );

        return [
            'total_activities' => $activitiesCount,
            'last_activity' => $lastActivity ? $lastActivity->activity_at : null,
            'notifications_created' => $notificationsCount,
            'reports_submitted' => $reportsCount,
            'volunteers_recruited' => $this->volunteers_recruited,
            'events_organized' => $this->events_organized,
            'system_engagement_score' => $engagementScore
        ];
    }

    /**
     * Get recent activities for this director during their tenure
     */
    public function getRecentActivities($limit = 10)
    {
        $user = $this->user();
        if (!$user) {
            return collect();
        }

        $query = ActivityLog::where('user_id', $user->id);

        // Filter activity logs by director's tenure period
        if ($this->start_date) {
            $query->where('activity_at', '>=', $this->start_date);
        }
        if ($this->end_date) {
            $query->where('activity_at', '<=', $this->end_date);
        }

        return $query->with('user')
            ->orderBy('activity_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'activity_type' => $log->activity_type,
                    'description' => $log->description,
                    'activity_at' => $log->activity_at,
                    'metadata' => $log->metadata
                ];
            });
    }

    /**
     * Get notifications accepted count during director's tenure
     */
    public function getNotificationsCreatedAttribute()
    {
        // Count notification_accepted activities for this director
        $count = $this->activityLogs()
            ->where('activity_type', 'notification_accepted')
            ->count();

        Log::info('DirectorHistory: Notifications accepted count for director ' . $this->director_name . ' (ID: ' . $this->id . '): ' . $count);
        return $count;
    }

    /**
     * Get notification activities count (accepted/declined notifications) during director's tenure
     */
    public function getNotificationActivitiesCountAttribute()
    {
        $user = $this->user();
        if (!$user) {
            return 0;
        }

        $query = $user->activityLogs()->whereIn('activity_type', ['notification_accepted', 'notification_declined']);

        // Filter activity logs by director's tenure period
        if ($this->start_date) {
            $query->where('activity_at', '>=', $this->start_date);
        }
        if ($this->end_date) {
            $query->where('activity_at', '<=', $this->end_date);
        }

        return $query->count();
    }

    /**
     * Get reports submitted count during director's tenure
     */
    public function getReportsSubmittedCountAttribute()
    {
        // Count report_submitted activities for this director
        return $this->activityLogs()
            ->where('activity_type', 'report_submitted')
            ->count();
    }

    /**
     * Get total activities count during director's tenure
     */
    public function getTotalActivitiesAttribute()
    {
        // Count all activity logs for this director
        $count = $this->activityLogs()->count();
        Log::info('DirectorHistory: Total activities count for director ' . $this->director_name . ' (ID: ' . $this->id . '): ' . $count);
        return $count;
    }

    /**
     * Get login activities count during director's tenure
     */
    public function getLoginActivitiesCountAttribute()
    {
        // Count login activities for this director
        return $this->activityLogs()
            ->where('activity_type', 'login')
            ->count();
    }

    /**
     * Get system engagement score during director's tenure
     */
    public function getSystemEngagementScoreAttribute()
    {
        $user = $this->user();
        if (!$user) {
            return 0;
        }

        // These methods now filter by date range automatically
        $notificationsCount = $this->getNotificationsCreatedAttribute();
        $reportsCount = $this->getReportsSubmittedCountAttribute();
        $activitiesCount = $this->getTotalActivitiesAttribute();
        $volunteersCount = $this->volunteers_recruited ?? 0;

        // Calculate engagement score based on various activities
        $engagementScore = min(
            100,
            ($notificationsCount * 10) +
                ($reportsCount * 15) +
                ($activitiesCount * 5) +
                ($volunteersCount * 20)
        );

        return $engagementScore;
    }

    /**
     * Get activity logs for this director during their tenure
     */
    public function getActivityLogsAttribute()
    {
        // Now we can directly get activities by director_history_id
        return $this->activityLogs()->get()->toArray();
    }

    /**
     * Get the actual volunteer count recruited by this director during their tenure
     */
    public function getActualVolunteerCountAttribute()
    {
        $associateGroup = $this->associateGroup;
        if (!$associateGroup) {
            return 0;
        }

        // Count volunteers for this associate group during the director's tenure
        $query = Volunteer::where('associate_group_id', $associateGroup->id);

        // Filter by director's tenure period
        if ($this->start_date) {
            $query->where('created_at', '>=', $this->start_date . ' 00:00:00');
        }
        if ($this->end_date) {
            $query->where('created_at', '<=', $this->end_date . ' 23:59:59');
        } else {
            // For current director, only count volunteers from their start date onwards
            $query->where('created_at', '>=', $this->start_date . ' 00:00:00');
        }

        return $query->count();
    }

    /**
     * Get the current director history ID for a user
     */
    public static function getCurrentDirectorHistoryId($userId)
    {
        $associateGroup = AssociateGroup::where('user_id', $userId)->first();
        if (!$associateGroup) {
            return null;
        }

        $currentDirector = self::where('associate_group_id', $associateGroup->id)
            ->where('is_current', true)
            ->first();

        return $currentDirector ? $currentDirector->id : null;
    }
}
