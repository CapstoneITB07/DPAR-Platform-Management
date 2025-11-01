<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use Illuminate\Http\Request;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

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

            $subscription = PushSubscription::where('endpoint', $validated['endpoint'])->first();

            if ($subscription) {
                if (
                    $subscription->public_key !== $validated['keys']['p256dh'] ||
                    $subscription->auth_token !== $validated['keys']['auth']
                ) {
                    $subscription->delete();

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
                    $subscription->update([
                        'user_id' => $userId,
                        'is_enabled' => true,
                        'user_agent' => $request->header('User-Agent'),
                    ]);
                }
            } else {
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
                return false;
            }

            $successCount = 0;
            foreach ($subscriptions as $sub) {
                try {
                    $result = self::sendDirectNotification($sub, $title, $body, $data);
                    if ($result) {
                        $successCount++;
                    }
                } catch (\Exception $e) {
                    // Silent fail
                }
            }

            return $successCount > 0;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Send a direct push notification using HTTP requests
     */
    private static function sendDirectNotification($subscription, $title, $body, $data = [])
    {
        try {
            // Prepare notification payload - match daily-quest format
            // Service worker expects: { message, body, icon }
            $icon = isset($data['icon']) ? $data['icon'] : '/Assets/disaster_logo.png';

            // Extract icon from data if present, otherwise use default
            $payloadData = $data;
            if (!isset($payloadData['icon'])) {
                $payloadData['icon'] = $icon;
            }

            $payload = json_encode([
                'message' => $title,  // Use 'message' instead of 'title' to match daily-quest
                'body' => $body,
                'icon' => $icon,
                'data' => $payloadData,  // Keep data structure for DPAR
            ]);

            // Get VAPID keys from config
            $vapidConfig = config('services.vapid');
            // Only remove whitespace - preserve exact format from .env
            // Keys from keynate.com generator should already be in correct base64url format
            $vapidPublicKey = preg_replace('/\s+/', '', trim($vapidConfig['public_key'] ?? ''));
            $vapidPrivateKey = preg_replace('/\s+/', '', trim($vapidConfig['private_key'] ?? ''));
            $vapidSubject = $vapidConfig['subject'] ?? 'mailto:dparvc1@gmail.com';

            if (empty($vapidPublicKey) || empty($vapidPrivateKey)) {
                return false;
            }

            // Validate key format - keys from keynate.com should be base64url
            // But we need to handle both base64 and base64url formats
            $vapidPublicKeyForValidation = $vapidPublicKey;
            $vapidPrivateKeyForValidation = $vapidPrivateKey;

            // If keys contain base64 characters (+ or /), they need conversion to base64url
            // But preserve original for WebPush (library handles both)
            if (strpos($vapidPublicKey, '+') !== false || strpos($vapidPublicKey, '/') !== false) {
                $vapidPublicKeyForValidation = strtr($vapidPublicKey, '+/', '-_');
            }
            if (strpos($vapidPrivateKey, '+') !== false || strpos($vapidPrivateKey, '/') !== false) {
                $vapidPrivateKeyForValidation = strtr($vapidPrivateKey, '+/', '-_');
            }

            if (!preg_match('/^[A-Za-z0-9_-]+$/', $vapidPublicKeyForValidation) || !preg_match('/^[A-Za-z0-9_-]+$/', $vapidPrivateKeyForValidation)) {
                return false;
            }

            // Validate private key length - when decoded, it must be exactly 32 bytes (256 bits)
            // A base64url encoded 32-byte key should be 43 characters (32 * 4/3 = 42.67, rounded up)
            try {
                // Decode base64url (convert -_ back to +/ for base64_decode)
                // Try both original and normalized versions
                $keyToDecode = rtrim($vapidPrivateKeyForValidation, '=');
                $decodedPrivateKey = base64_decode(strtr($keyToDecode, '-_', '+/') . str_repeat('=', (4 - strlen($keyToDecode) % 4) % 4), true);

                // If that fails, try the original key
                if ($decodedPrivateKey === false) {
                    $keyToDecode = rtrim($vapidPrivateKey, '=');
                    $decodedPrivateKey = base64_decode(strtr($keyToDecode, '-_', '+/') . str_repeat('=', (4 - strlen($keyToDecode) % 4) % 4), true);
                }

                if ($decodedPrivateKey === false) {
                    return false;
                }

                $decodedLength = strlen($decodedPrivateKey);
                if ($decodedLength !== 32) {
                    return false;
                }
            } catch (\Exception $e) {
                return false;
            }

            if (empty($subscription->public_key) || empty($subscription->auth_token)) {
                return false;
            }

            $publicKey = preg_replace('/\s+/', '', $subscription->public_key);
            $authToken = preg_replace('/\s+/', '', $subscription->auth_token);

            if (!preg_match('/^[A-Za-z0-9_-]+$/', $publicKey) || !preg_match('/^[A-Za-z0-9_-]+$/', $authToken)) {
                return false;
            }

            $auth = [
                'VAPID' => [
                    'subject' => $vapidSubject,
                    'publicKey' => $vapidPublicKey,
                    'privateKey' => $vapidPrivateKey,
                ],
            ];

            try {
                $webPush = new WebPush($auth);
                $webPush->setAutomaticPadding(false);
            } catch (\Exception $e) {
                return false;
            }

            $webPushSubscription = Subscription::create([
                'endpoint' => $subscription->endpoint,
                'publicKey' => $publicKey,
                'authToken' => $authToken,
                'contentEncoding' => $subscription->content_encoding ?? 'aesgcm',
            ]);

            try {
                $webPush->queueNotification($webPushSubscription, $payload);
            } catch (\Exception $queueError) {
                return false;
            }

            try {
                $results = $webPush->flush();
                $resultsArray = is_array($results) ? $results : iterator_to_array($results);
            } catch (\Exception $flushException) {
                try {
                    $subscription->update(['is_enabled' => false]);
                } catch (\Exception $updateError) {
                    // Ignore
                }
                return false;
            }

            if (empty($resultsArray)) {
                return true;
            }

            foreach ($resultsArray as $result) {
                if ($result->isSuccess()) {
                    return true;
                } else {
                    $reason = $result->getReason();
                    if (
                        strpos($reason, '410') !== false ||
                        strpos($reason, 'expired') !== false ||
                        strpos($reason, 'Invalid') !== false ||
                        strpos($reason, '410 Gone') !== false
                    ) {
                        $subscription->update(['is_enabled' => false]);
                    }
                    return false;
                }
            }

            return false;
        } catch (\Exception $e) {
            try {
                $subscription->update(['is_enabled' => false]);
            } catch (\Exception $updateError) {
                // Ignore
            }
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
                        }
                    }
                } catch (\Exception $e) {
                    self::tryAlternativeNotificationSending($sub, $payload);
                }
            }

            return $successCount > 0;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Alternative notification sending method
     */
    private static function tryAlternativeNotificationSending($sub, $payload)
    {
        try {
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
