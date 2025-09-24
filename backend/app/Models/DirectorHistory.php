<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\ActivityLog;

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
        'activity_logs'
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
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'director_email', 'email');
    }

    /**
     * Get the activity logs for this director
     */
    public function activityLogs()
    {
        if (!$this->user) {
            return collect(); // Return empty collection if no user
        }

        return ActivityLog::where('user_id', $this->user->id)->get();
    }

    /**
     * Get the achievements for this director
     */
    public function achievements(): HasMany
    {
        return $this->hasMany(DirectorAchievement::class);
    }

    /**
     * Get the reports created by this director
     */
    public function reports(): HasMany
    {
        return $this->hasMany(Report::class, 'user_id', 'user_id');
    }

    /**
     * Get the notifications created by this director
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'user_id', 'user_id');
    }

    /**
     * Get the volunteers recruited by this director
     */
    public function recruitedVolunteers(): HasMany
    {
        return $this->hasMany(Volunteer::class, 'recruited_by_director_id');
    }

    /**
     * Get director activity summary
     */
    public function getActivitySummary()
    {
        $user = $this->user;
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

        $notificationsCount = $this->notifications()->count();
        $reportsCount = $this->reports()->count();
        $activitiesCount = $this->activityLogs()->count();
        $lastActivity = $this->activityLogs()->latest('activity_at')->first();

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
     * Get recent activities for this director
     */
    public function getRecentActivities($limit = 10)
    {
        $user = $this->user;
        if (!$user) {
            return collect();
        }

        return $this->activityLogs()
            ->with('user')
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
     * Get notifications created count
     */
    public function getNotificationsCreatedAttribute()
    {
        if (!$this->user) {
            return 0;
        }
        return $this->user->notifications ? $this->user->notifications->count() : 0;
    }

    /**
     * Get notification activities count (accepted/declined notifications)
     */
    public function getNotificationActivitiesCountAttribute()
    {
        if (!$this->user) {
            return 0;
        }
        return $this->user->activityLogs ? $this->user->activityLogs->whereIn('activity_type', ['notification_accepted', 'notification_declined'])->count() : 0;
    }

    /**
     * Get reports submitted count
     */
    public function getReportsSubmittedCountAttribute()
    {
        if (!$this->user) {
            return 0;
        }
        return $this->user->reports ? $this->user->reports->count() : 0;
    }

    /**
     * Get total activities count
     */
    public function getTotalActivitiesAttribute()
    {
        if (!$this->user) {
            return 0;
        }
        return $this->user->activityLogs ? $this->user->activityLogs->count() : 0;
    }

    /**
     * Get login activities count
     */
    public function getLoginActivitiesCountAttribute()
    {
        if (!$this->user) {
            return 0;
        }
        return $this->user->activityLogs ? $this->user->activityLogs->where('activity_type', 'login')->count() : 0;
    }

    /**
     * Get system engagement score
     */
    public function getSystemEngagementScoreAttribute()
    {
        if (!$this->user) {
            return 0;
        }

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
     * Get activity logs for this director
     */
    public function getActivityLogsAttribute()
    {
        if (!$this->user) {
            return [];
        }
        return $this->user->activityLogs ? $this->user->activityLogs->toArray() : [];
    }
}
