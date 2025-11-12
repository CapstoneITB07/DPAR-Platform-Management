<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SystemAlert extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'message',
        'type',
        'is_active',
        'show_to_roles',
        'dismissible',
        'send_push_notification',
        'expires_at',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'show_to_roles' => 'array',
        'dismissible' => 'boolean',
        'send_push_notification' => 'boolean',
        'expires_at' => 'datetime',
    ];

    /**
     * Get the user who created this alert
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope to get active alerts
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->whereNull('deleted_at') // Exclude soft-deleted alerts
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Check if alert should be shown to a specific role
     * 
     * IMPORTANT: Superadmin is ALWAYS excluded from seeing alerts.
     * They create the alerts, so they don't need to see them.
     * 
     * @param string $role The user's role
     * @return bool True if alert should be shown to this role, false otherwise
     */
    public function shouldShowToRole($role)
    {
        // ALWAYS exclude superadmin - they create alerts, so they don't need to see them
        if ($role === 'superadmin') {
            return false;
        }

        // Get the show_to_roles value (already cast to array by Laravel)
        $showToRoles = $this->show_to_roles;
        
        // If show_to_roles is null, empty array, or empty, show to all users
        // (superadmin is already excluded above, so this applies to: head_admin, associate_group_leader, citizen)
        if ($showToRoles === null || (is_array($showToRoles) && count($showToRoles) === 0)) {
            return true; // Show to all non-superadmin users
        }

        // Ensure show_to_roles is an array before checking
        if (!is_array($showToRoles)) {
            return true; // If it's not an array, show to all (safety fallback)
        }

        // Check if the role is in the allowed roles array
        // Note: superadmin is never in this array (validation only allows: head_admin, associate_group_leader, citizen)
        return in_array($role, $showToRoles);
    }
}
