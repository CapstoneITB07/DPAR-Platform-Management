<?php
require __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "===========================================\n";
echo "   Push Notification Diagnostics\n";
echo "===========================================\n\n";

echo "1. Checking VAPID Keys...\n";
$publicKey = env('VAPID_PUBLIC_KEY');
$privateKey = env('VAPID_PRIVATE_KEY');
$subject = env('VAPID_SUBJECT');

echo "   Public Key: " . (empty($publicKey) ? "❌ MISSING" : "✓ Found (" . strlen($publicKey) . " chars)") . "\n";
echo "   Private Key: " . (empty($privateKey) ? "❌ MISSING" : "✓ Found (" . strlen($privateKey) . " chars)") . "\n";
echo "   Subject: " . (empty($subject) ? "❌ MISSING" : "✓ $subject") . "\n\n";

echo "2. Testing VAPID Key Format...\n";
if (!empty($publicKey) && !empty($privateKey)) {
    try {
        $auth = ['VAPID' => ['subject' => $subject, 'publicKey' => $publicKey, 'privateKey' => $privateKey]];
        $webPush = new \Minishlink\WebPush\WebPush($auth);
        echo "   ✓ SUCCESS! VAPID keys are in correct format!\n\n";
    } catch (\Exception $e) {
        echo "   ❌ ERROR: " . $e->getMessage() . "\n";
        echo "   This means your VAPID keys are in WRONG FORMAT!\n\n";
        echo "   SOLUTION: Get new keys from https://vapidkeys.com/\n\n";
        exit(1);
    }
}

echo "3. Checking Subscriptions...\n";
$count = \App\Models\PushSubscription::count();
echo "   Total subscriptions: $count\n\n";

echo "===========================================\n";
echo empty($publicKey) || empty($privateKey) ? "❌ VAPID keys missing!\n" : "✅ All checks passed!\n";
echo "===========================================\n";

