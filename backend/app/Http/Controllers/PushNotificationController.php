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
                // Update existing subscription
                $subscription->update([
                    'user_id' => $userId,
                    'public_key' => $validated['keys']['p256dh'],
                    'auth_token' => $validated['keys']['auth'],
                    'is_enabled' => true,
                    'user_agent' => $request->header('User-Agent'),
                ]);
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
            // Get VAPID keys from environment
            $vapidPublicKey = env('VAPID_PUBLIC_KEY');
            $vapidPrivateKey = env('VAPID_PRIVATE_KEY');
            $vapidSubject = env('VAPID_SUBJECT', 'mailto:admin@dpar.com');

            if (!$vapidPublicKey || !$vapidPrivateKey) {
                Log::warning('VAPID keys not configured');
                return false;
            }

            $auth = [
                'VAPID' => [
                    'subject' => $vapidSubject,
                    'publicKey' => $vapidPublicKey,
                    'privateKey' => $vapidPrivateKey,
                ],
            ];

            $webPush = new WebPush($auth);
            $webPush->setAutomaticPadding(true);

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

            // Prepare notification payload
            $payload = json_encode([
                'title' => $title,
                'body' => $body,
                'icon' => '/Assets/disaster_logo.png',
                'badge' => '/Assets/disaster_logo.png',
                'data' => $data,
            ]);

            // Send to all subscriptions
            foreach ($subscriptions as $sub) {
                $subscription = Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'publicKey' => $sub->public_key,
                    'authToken' => $sub->auth_token,
                    'contentEncoding' => $sub->content_encoding,
                ]);

                $webPush->queueNotification($subscription, $payload);
            }

            // Send all queued notifications
            $results = $webPush->flush();

            // Handle failed subscriptions
            foreach ($results as $result) {
                if (!$result->isSuccess()) {
                    $endpoint = $result->getEndpoint();
                    
                    // Delete invalid subscriptions (410 Gone or 404 Not Found)
                    if ($result->getResponse() && in_array($result->getResponse()->getStatusCode(), [404, 410])) {
                        PushSubscription::where('endpoint', $endpoint)->delete();
                        Log::info('Deleted invalid push subscription: ' . $endpoint);
                    }
                }
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send push notification: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send test notification (for testing purposes)
     */
    public function sendTest(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        }

        $result = self::sendNotification(
            $user->id,
            'Test Notification',
            'This is a test notification from DPAR Platform',
            ['url' => '/']
        );

        return response()->json([
            'success' => $result,
            'message' => $result ? 'Test notification sent' : 'Failed to send test notification'
        ]);
    }
}
