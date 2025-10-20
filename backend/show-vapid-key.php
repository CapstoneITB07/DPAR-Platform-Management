<?php
require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "==========================================\n";
echo "Your VAPID Public Key:\n";
echo "==========================================\n";
echo env('VAPID_PUBLIC_KEY');
echo "\n==========================================\n";

