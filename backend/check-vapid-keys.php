<?php
/**
 * Quick script to check if VAPID keys are configured
 * Run: php check-vapid-keys.php
 */

// Load environment
require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "==========================================\n";
echo "   VAPID Keys Configuration Check\n";
echo "==========================================\n\n";

$publicKey = env('VAPID_PUBLIC_KEY');
$privateKey = env('VAPID_PRIVATE_KEY');
$subject = env('VAPID_SUBJECT');

// Check public key
echo "Public Key:\n";
if (empty($publicKey)) {
    echo "  ❌ NOT CONFIGURED\n";
    echo "  Add VAPID_PUBLIC_KEY to your .env file\n";
} else {
    echo "  ✓ Configured\n";
    echo "  Value: " . substr($publicKey, 0, 30) . "...\n";
}
echo "\n";

// Check private key
echo "Private Key:\n";
if (empty($privateKey)) {
    echo "  ❌ NOT CONFIGURED\n";
    echo "  Add VAPID_PRIVATE_KEY to your .env file\n";
} else {
    echo "  ✓ Configured\n";
    echo "  Value: " . substr($privateKey, 0, 30) . "...\n";
}
echo "\n";

// Check subject
echo "Subject:\n";
if (empty($subject)) {
    echo "  ❌ NOT CONFIGURED\n";
    echo "  Add VAPID_SUBJECT to your .env file\n";
} else {
    echo "  ✓ Configured\n";
    echo "  Value: " . $subject . "\n";
}
echo "\n";

// Summary
echo "==========================================\n";
if (empty($publicKey) || empty($privateKey) || empty($subject)) {
    echo "❌ INCOMPLETE CONFIGURATION\n\n";
    echo "Push notifications will NOT work!\n\n";
    echo "Add these to your backend/.env file:\n\n";
    echo "VAPID_PUBLIC_KEY=BO2O3tKl9nICMKOadqdXRDjSkZnUvn7PBUQabt1NZZ1j7FPGiSSfmzO-m2T2Prvr6OwIkPzJIGZTNXrJkZVW4oM\n";
    echo "VAPID_PRIVATE_KEY=your_matching_private_key_here\n";
    echo "VAPID_SUBJECT=mailto:admin@dpar.com\n\n";
    echo "Get keys from: https://vapidkeys.com/\n";
} else {
    echo "✓ ALL CONFIGURED\n\n";
    echo "Push notifications should work!\n";
    
    // Verify keys match
    if ($publicKey !== 'BO2O3tKl9nICMKOadqdXRDjSkZnUvn7PBUQabt1NZZ1j7FPGiSSfmzO-m2T2Prvr6OwIkPzJIGZTNXrJkZVW4oM') {
        echo "\n⚠️  WARNING: Public key doesn't match frontend!\n";
        echo "Frontend uses: BO2O3tKl9nICMKOadqdXRDjSkZnUvn7PBUQabt1NZZ1j7FPGiSSfmzO-m2T2Prvr6OwIkPzJIGZTNXrJkZVW4oM\n";
        echo "Backend uses: " . $publicKey . "\n";
        echo "\nThey MUST match!\n";
    }
}
echo "==========================================\n";

