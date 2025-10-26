<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use Illuminate\Http\Request;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use Illuminate\Support\Facades\Log;

class PushNotificationController extends Controller
{
    /**
     * Subscribe to push notifications
     */
    public function subscribe(Request $request)
    {
        $validated = $request->validate([
            'endpoint' => 'required|string',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
        ]);

        try {
            $userId = $request->user() ? $request->user()->id : null;

            // Check if subscription already exists
            $subscription = PushSubscription::where('endpoint', $validated['endpoint'])->first();

            if ($subscription) {
                // Check if keys have changed - if so, delete old subscription and create new one
                if (
                    $subscription->public_key !== $validated['keys']['p256dh'] ||
                    $subscription->auth_token !== $validated['keys']['auth']
                ) {

                    Log::info('Subscription keys changed, recreating subscription');
                    $subscription->delete();

                    // Create new subscription with new keys
                    $subscription = PushSubscription::create([
                        'user_id' => $userId,
                        'endpoint' => $validated['endpoint'],
                        'public_key' => $validated['keys']['p256dh'],
                        'auth_token' => $validated['keys']['auth'],
                        'content_encoding' => 'aesgcm',
                        'is_enabled' => true,
                        'user_agent' => $request->header('User-Agent'),
                    ]);
                } else {
                    // Keys are the same, just update user info
                    $subscription->update([
                        'user_id' => $userId,
                        'is_enabled' => true,
                        'user_agent' => $request->header('User-Agent'),
                    ]);
                }
            } else {
                // Create new subscription
                $subscription = PushSubscription::create([
                    'user_id' => $userId,
                    'endpoint' => $validated['endpoint'],
                    'public_key' => $validated['keys']['p256dh'],
                    'auth_token' => $validated['keys']['auth'],
                    'content_encoding' => 'aesgcm',
                    'is_enabled' => true,
                    'user_agent' => $request->header('User-Agent'),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Subscription saved successfully',
                'subscription_id' => $subscription->id
            ]);
        } catch (\Exception $e) {
            Log::error('Push subscription error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to save subscription'
            ], 500);
        }
    }

    /**
     * Unsubscribe from push notifications
     */
    public function unsubscribe(Request $request)
    {
        $validated = $request->validate([
            'endpoint' => 'required|string',
        ]);

        try {
            $subscription = PushSubscription::where('endpoint', $validated['endpoint'])->first();

            if ($subscription) {
                $subscription->delete();
                return response()->json([
                    'success' => true,
                    'message' => 'Unsubscribed successfully'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Subscription not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Push unsubscribe error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to unsubscribe'
            ], 500);
        }
    }

    /**
     * Toggle subscription status
     */
    public function toggleSubscription(Request $request)
    {
        $validated = $request->validate([
            'endpoint' => 'required|string',
            'enabled' => 'required|boolean',
        ]);

        try {
            $subscription = PushSubscription::where('endpoint', $validated['endpoint'])->first();

            if ($subscription) {
                $subscription->update(['is_enabled' => $validated['enabled']]);
                return response()->json([
                    'success' => true,
                    'message' => 'Subscription status updated',
                    'is_enabled' => $subscription->is_enabled
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Subscription not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Push toggle error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle subscription'
            ], 500);
        }
    }

    /**
     * Get user's subscription status
     */
    public function getStatus(Request $request)
    {
        try {
            $userId = $request->user() ? $request->user()->id : null;

            if (!$userId) {
                return response()->json([
                    'subscribed' => false,
                    'enabled' => false
                ]);
            }

            $subscription = PushSubscription::where('user_id', $userId)
                ->where('is_enabled', true)
                ->first();

            return response()->json([
                'subscribed' => $subscription !== null,
                'enabled' => $subscription ? $subscription->is_enabled : false,
                'endpoint' => $subscription ? $subscription->endpoint : null
            ]);
        } catch (\Exception $e) {
            Log::error('Push status error: ' . $e->getMessage());
            return response()->json([
                'subscribed' => false,
                'enabled' => false
            ]);
        }
    }

    /**
     * Send push notification to specific users or all users
     */
    public static function sendNotification($userIds = null, $title, $body, $data = [])
    {
        try {
            // Get subscriptions
            $query = PushSubscription::where('is_enabled', true);

            if ($userIds !== null) {
                if (is_array($userIds)) {
                    $query->whereIn('user_id', $userIds);
                } else {
                    $query->where('user_id', $userIds);
                }
            }

            $subscriptions = $query->get();

            if ($subscriptions->isEmpty()) {
                Log::info('No active push subscriptions found');
                return false;
            }

            Log::info('Found ' . $subscriptions->count() . ' active push subscriptions');

            // Try to send actual push notifications using a different approach
            $successCount = 0;
            foreach ($subscriptions as $sub) {
                try {
                    $result = self::sendDirectNotification($sub, $title, $body, $data);
                    if ($result) {
                        $successCount++;
                        Log::info('Push notification sent successfully to: ' . substr($sub->endpoint, 0, 50) . '...');
                    } else {
                        Log::error('Failed to send notification to: ' . substr($sub->endpoint, 0, 50) . '...');
                    }
                } catch (\Exception $e) {
                    Log::error('Error sending notification to subscription ' . $sub->id . ': ' . $e->getMessage());
                }
            }

            Log::info('Push notifications sent: ' . $successCount . ' successful, ' . ($subscriptions->count() - $successCount) . ' failed');
            return $successCount > 0;
        } catch (\Exception $e) {
            Log::error('Failed to process push notification: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send a direct push notification using HTTP requests
     */
    private static function sendDirectNotification($subscription, $title, $body, $data = [])
    {
        try {
            // Prepare notification payload
            $payload = json_encode([
                'title' => $title,
                'body' => $body,
                'icon' => '/Assets/disaster_logo.png',
                'badge' => '/Assets/disaster_logo.png',
                'data' => $data,
            ]);

            // Get VAPID keys from config
            $vapidConfig = config('services.vapid');
            $vapidPublicKey = trim($vapidConfig['public_key'] ?? '');
            $vapidPrivateKey = trim($vapidConfig['private_key'] ?? '');
            $vapidSubject = $vapidConfig['subject'] ?? 'mailto:admin@dpar.com';

            if (!$vapidPublicKey || !$vapidPrivateKey) {
                Log::error('VAPID keys not configured');
                return false;
            }

            // Try different VAPID key formats
            $authConfigs = [
                // Try with full VAPID structure
                [
                    'VAPID' => [
                        'subject' => $vapidSubject,
                        'publicKey' => $vapidPublicKey,
                        'privateKey' => $vapidPrivateKey,
                    ],
                ],
                // Try with just keys
                [
                    'VAPID' => [
                        'publicKey' => $vapidPublicKey,
                        'privateKey' => $vapidPrivateKey,
                    ],
                ],
                // Try with different subject format
                [
                    'VAPID' => [
                        'subject' => 'mailto:no-reply@dparvc.com',
                        'publicKey' => $vapidPublicKey,
                        'privateKey' => $vapidPrivateKey,
                    ],
                ]
            ];

            // Create WebPush instance with VAPID authentication
            $webPush = new WebPush($authConfigs[0]); // Use first auth config
            $webPush->setAutomaticPadding(false);
            $webPush->setDefaultOptions([
                'TTL' => 300,
                'urgency' => 'normal'
            ]);

            // Create subscription object
            $webPushSubscription = Subscription::create([
                'endpoint' => $subscription->endpoint,
                'publicKey' => $subscription->public_key,
                'authToken' => $subscription->auth_token,
                'contentEncoding' => $subscription->content_encoding,
            ]);

            // Queue and send notification
            $webPush->queueNotification($webPushSubscription, $payload);
            $results = $webPush->flush();

            foreach ($results as $result) {
                if ($result->isSuccess()) {
                    Log::info('Push notification sent successfully to: ' . $result->getEndpoint());
                    return true;
                } else {
                    Log::error('Push notification failed: ' . $result->getReason());
                    return false;
                }
            }

            return false;
        } catch (\Exception $e) {
            Log::error('Error in sendDirectNotification: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send test notification (for testing purposes)
     */
    public function sendTest(Request $request)
    {
        // Send to all active subscriptions for testing
        $result = self::sendNotification(
            null, // Send to all subscriptions
            'Test Notification',
            'This is a test notification from DPAR Platform',
            ['url' => '/', 'type' => 'test']
        );

        return response()->json([
            'success' => $result,
            'message' => $result ? 'Test notification sent to all active subscriptions' : 'Failed to send test notification'
        ]);
    }

    /**
     * Clear old/invalid subscriptions
     */
    public function clearOldSubscriptions(Request $request)
    {
        try {
            // Clear subscriptions older than 30 days
            $deletedCount = PushSubscription::where('created_at', '<', now()->subDays(30))->delete();

            // Clear subscriptions with invalid endpoints
            $invalidCount = PushSubscription::where('endpoint', 'like', '%invalid%')
                ->orWhere('endpoint', 'like', '%expired%')
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Old subscriptions cleared',
                'deleted_old' => $deletedCount,
                'deleted_invalid' => $invalidCount
            ]);
        } catch (\Exception $e) {
            Log::error('Error clearing old subscriptions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear old subscriptions'
            ], 500);
        }
    }

    /**
     * Clear ALL subscriptions (for fixing key format issues)
     */
    public function clearAllSubscriptions(Request $request)
    {
        try {
            $deletedCount = PushSubscription::truncate();

            return response()->json([
                'success' => true,
                'message' => 'All subscriptions cleared - users need to re-subscribe',
                'deleted_count' => 'all'
            ]);
        } catch (\Exception $e) {
            Log::error('Error clearing all subscriptions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear all subscriptions'
            ], 500);
        }
    }

    /**
     * Debug subscription status and VAPID configuration
     */
    public function debugSubscriptions(Request $request)
    {
        try {
            $userId = $request->user() ? $request->user()->id : null;

            // Get all subscriptions
            $allSubscriptions = PushSubscription::all();
            $userSubscriptions = $userId ? PushSubscription::where('user_id', $userId)->get() : collect();

            // Check VAPID configuration
            $vapidConfig = config('services.vapid');
            $vapidConfigured = !empty($vapidConfig['public_key']) && !empty($vapidConfig['private_key']);

            // Get subscription statistics
            $stats = [
                'total_subscriptions' => $allSubscriptions->count(),
                'enabled_subscriptions' => $allSubscriptions->where('is_enabled', true)->count(),
                'user_subscriptions' => $userSubscriptions->count(),
                'vapid_configured' => $vapidConfigured,
                'vapid_public_key' => $vapidConfigured ? substr($vapidConfig['public_key'], 0, 20) . '...' : 'Not configured',
                'vapid_subject' => $vapidConfig['subject'] ?? 'Not set'
            ];

            return response()->json([
                'success' => true,
                'stats' => $stats,
                'all_subscriptions' => $allSubscriptions->map(function ($sub) {
                    return [
                        'id' => $sub->id,
                        'user_id' => $sub->user_id,
                        'endpoint' => substr($sub->endpoint, 0, 50) . '...',
                        'is_enabled' => $sub->is_enabled,
                        'created_at' => $sub->created_at,
                        'user_agent' => $sub->user_agent
                    ];
                }),
                'user_subscriptions' => $userSubscriptions->map(function ($sub) {
                    return [
                        'id' => $sub->id,
                        'endpoint' => substr($sub->endpoint, 0, 50) . '...',
                        'is_enabled' => $sub->is_enabled,
                        'created_at' => $sub->created_at
                    ];
                })
            ]);
        } catch (\Exception $e) {
            Log::error('Error debugging subscriptions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to debug subscriptions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Fallback method to send notifications individually
     */
    private static function sendNotificationsIndividually($subscriptions, $payload)
    {
        try {
            Log::info('Attempting individual notification sending as fallback');

            $successCount = 0;
            foreach ($subscriptions as $sub) {
                try {
                    // Try to send using a fresh WebPush instance
                    $vapidConfig = config('services.vapid');
                    $vapidPublicKey = trim($vapidConfig['public_key'] ?? '');
                    $vapidPrivateKey = trim($vapidConfig['private_key'] ?? '');
                    $vapidSubject = $vapidConfig['subject'] ?? 'mailto:admin@dpar.com';

                    // Create minimal auth config
                    $auth = [
                        'VAPID' => [
                            'subject' => $vapidSubject,
                            'publicKey' => $vapidPublicKey,
                            'privateKey' => $vapidPrivateKey,
                        ],
                    ];

                    $webPush = new WebPush($auth);
                    $webPush->setAutomaticPadding(false);
                    $webPush->setDefaultOptions([
                        'TTL' => 300,
                        'urgency' => 'normal'
                    ]);

                    $subscription = Subscription::create([
                        'endpoint' => $sub->endpoint,
                        'publicKey' => $sub->public_key,
                        'authToken' => $sub->auth_token,
                        'contentEncoding' => $sub->content_encoding,
                    ]);

                    $webPush->queueNotification($subscription, $payload);
                    $results = $webPush->flush();

                    foreach ($results as $result) {
                        if ($result->isSuccess()) {
                            $successCount++;
                            Log::info('Individual notification sent successfully to: ' . $result->getEndpoint());
                        } else {
                            Log::error('Individual notification failed: ' . $result->getReason());
                        }
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to send individual notification to subscription ' . $sub->id . ': ' . $e->getMessage());
                    // Try one more time with a different approach
                    self::tryAlternativeNotificationSending($sub, $payload);
                }
            }

            Log::info('Individual notification sending completed. Success: ' . $successCount);
            return $successCount > 0;
        } catch (\Exception $e) {
            Log::error('Individual notification sending failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Alternative notification sending method
     */
    private static function tryAlternativeNotificationSending($sub, $payload)
    {
        try {
            Log::info('Trying alternative notification sending for subscription ' . $sub->id);

            // For now, just log that we tried
            Log::info('Alternative notification method attempted for: ' . $sub->endpoint);

            // In the future, we could implement a different push service here
            return true;
        } catch (\Exception $e) {
            Log::error('Alternative notification sending failed: ' . $e->getMessage());
            return false;
        }
    }
}
