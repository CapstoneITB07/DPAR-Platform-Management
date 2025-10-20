<?php

namespace App\Services;

use App\Http\Controllers\PushNotificationController;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    /**
     * Send notification when admin receives a new application
     */
    public static function notifyAdminNewApplication($application)
    {
        try {
            // Check if VAPID keys are configured
            if (!self::isConfigured()) {
                Log::warning('Push notifications not configured - skipping notification');
                return;
            }
            
            // Get all admin users
            $adminIds = \App\Models\User::where('role', 'head_admin')->pluck('id')->toArray();
            
            PushNotificationController::sendNotification(
                $adminIds,
                'New Application Received',
                "New application from {$application->name}",
                [
                    'url' => '/admin/associate-groups',
                    'type' => 'new_application'
                ]
            );
        } catch (\Exception $e) {
            Log::error('Failed to send new application notification: ' . $e->getMessage());
        }
    }
    
    /**
     * Check if push notifications are configured
     */
    private static function isConfigured()
    {
        return !empty(env('VAPID_PUBLIC_KEY')) && !empty(env('VAPID_PRIVATE_KEY'));
    }

    /**
     * Send notification when admin receives a new report
     */
    public static function notifyAdminNewReport($report)
    {
        try {
            if (!self::isConfigured()) {
                Log::warning('Push notifications not configured - skipping notification');
                return;
            }
            
            // Get all admin users
            $adminIds = \App\Models\User::where('role', 'head_admin')->pluck('id')->toArray();
            
            $user = $report->user;
            $userName = $user ? $user->name : 'Unknown';
            
            PushNotificationController::sendNotification(
                $adminIds,
                'New Report Submitted',
                "New report submitted by {$userName}",
                [
                    'url' => '/admin/approval-aor',
                    'type' => 'new_report'
                ]
            );
        } catch (\Exception $e) {
            Log::error('Failed to send new report notification: ' . $e->getMessage());
        }
    }

    /**
     * Send notification when admin receives notification response from associate
     */
    public static function notifyAdminNotificationResponse($notification, $recipient)
    {
        try {
            if (!self::isConfigured()) {
                Log::warning('Push notifications not configured - skipping notification');
                return;
            }
            
            // Get all admin users
            $adminIds = \App\Models\User::where('role', 'head_admin')->pluck('id')->toArray();
            
            $user = $recipient->user;
            $userName = $user ? $user->name : 'Unknown';
            
            PushNotificationController::sendNotification(
                $adminIds,
                'Notification Response Received',
                "{$userName} responded to: {$notification->title}",
                [
                    'url' => '/admin/notifications',
                    'type' => 'notification_response'
                ]
            );
        } catch (\Exception $e) {
            Log::error('Failed to send notification response alert: ' . $e->getMessage());
        }
    }

    /**
     * Send notification to associates when they receive a notification from admin
     */
    public static function notifyAssociatesNewNotification($notification, $recipientUserIds)
    {
        try {
            if (!self::isConfigured()) {
                Log::warning('Push notifications not configured - skipping notification');
                return;
            }
            
            PushNotificationController::sendNotification(
                $recipientUserIds,
                'New Notification',
                $notification->title,
                [
                    'url' => '/associate/notification',
                    'type' => 'new_notification'
                ]
            );
        } catch (\Exception $e) {
            Log::error('Failed to send notification to associates: ' . $e->getMessage());
        }
    }

    /**
     * Send notification to associates when new announcement is posted
     */
    public static function notifyAssociatesNewAnnouncement($announcement)
    {
        try {
            if (!self::isConfigured()) {
                Log::warning('Push notifications not configured - skipping notification');
                return;
            }
            
            // Get all associate users
            $associateIds = \App\Models\User::where('role', 'associate_group_leader')->pluck('id')->toArray();
            
            PushNotificationController::sendNotification(
                $associateIds,
                'New Announcement',
                $announcement->title ?: 'A new announcement has been posted',
                [
                    'url' => '/associate/announcements',
                    'type' => 'new_announcement'
                ]
            );
        } catch (\Exception $e) {
            Log::error('Failed to send announcement notification to associates: ' . $e->getMessage());
        }
    }

    /**
     * Send notification to associate when their report is approved
     */
    public static function notifyAssociateReportApproved($report)
    {
        try {
            if (!self::isConfigured()) {
                Log::warning('Push notifications not configured - skipping notification');
                return;
            }
            
            PushNotificationController::sendNotification(
                $report->user_id,
                'Report Approved',
                'Your report has been approved',
                [
                    'url' => '/associate/reports',
                    'type' => 'report_approved'
                ]
            );
        } catch (\Exception $e) {
            Log::error('Failed to send report approved notification: ' . $e->getMessage());
        }
    }

    /**
     * Send notification to associate when their report is rejected
     */
    public static function notifyAssociateReportRejected($report)
    {
        try {
            if (!self::isConfigured()) {
                Log::warning('Push notifications not configured - skipping notification');
                return;
            }
            
            PushNotificationController::sendNotification(
                $report->user_id,
                'Report Rejected',
                'Your report has been rejected',
                [
                    'url' => '/associate/reports',
                    'type' => 'report_rejected'
                ]
            );
        } catch (\Exception $e) {
            Log::error('Failed to send report rejected notification: ' . $e->getMessage());
        }
    }

    /**
     * Send notification to all citizens (no user_id) about new announcement
     */
    public static function notifyCitizensNewAnnouncement($announcement)
    {
        try {
            if (!self::isConfigured()) {
                Log::warning('Push notifications not configured - skipping notification');
                return;
            }
            
            // Send to all subscriptions (including those without user_id for citizens)
            PushNotificationController::sendNotification(
                null, // null means all subscriptions
                'New Announcement',
                $announcement->title ?: 'A new announcement has been posted',
                [
                    'url' => '/citizen',
                    'type' => 'new_announcement'
                ]
            );
        } catch (\Exception $e) {
            Log::error('Failed to send announcement notification to citizens: ' . $e->getMessage());
        }
    }

    /**
     * Send notification to all about new training program
     */
    public static function notifyNewTrainingProgram($program)
    {
        try {
            if (!self::isConfigured()) {
                Log::warning('Push notifications not configured - skipping notification');
                return;
            }
            
            // Send to all subscriptions
            PushNotificationController::sendNotification(
                null, // null means all subscriptions
                'New Training Program',
                $program->name ?: 'A new training program is available',
                [
                    'url' => '/citizen',
                    'type' => 'new_training_program'
                ]
            );
        } catch (\Exception $e) {
            Log::error('Failed to send training program notification: ' . $e->getMessage());
        }
    }
}

