<?php

/**
 * Generate VAPID keys for push notifications
 * Run this script to generate VAPID keys for your production environment
 */

require_once __DIR__ . '/../../vendor/autoload.php';

use Minishlink\WebPush\VAPID;

try {
    // Generate VAPID keys
    $vapidKeys = VAPID::createVapidKeys();

    echo "VAPID Keys Generated Successfully!\n";
    echo "=====================================\n\n";

    echo "Add these to your .env file:\n";
    echo "VAPID_PUBLIC_KEY=" . $vapidKeys['publicKey'] . "\n";
    echo "VAPID_PRIVATE_KEY=" . $vapidKeys['privateKey'] . "\n";
    echo "VAPID_SUBJECT=mailto:no-reply@dparvc.com\n\n";

    echo "Also update your frontend/src/utils/pushNotifications.js:\n";
    echo "const VAPID_PUBLIC_KEY = '" . $vapidKeys['publicKey'] . "';\n\n";

    echo "After updating both files, run:\n";
    echo "php artisan config:clear\n";
    echo "php artisan config:cache\n\n";
} catch (Exception $e) {
    echo "Error generating VAPID keys: " . $e->getMessage() . "\n";
    exit(1);
}
