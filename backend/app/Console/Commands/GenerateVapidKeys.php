<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateVapidKeys extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'vapid:generate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate VAPID keys for Web Push notifications';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Generating VAPID keys...');
        
        try {
            // Generate keys using OpenSSL
            $keys = $this->generateVapidKeys();
            
            $this->newLine();
            $this->info('VAPID keys generated successfully!');
            $this->newLine();
            $this->line('Add these to your .env file:');
            $this->newLine();
            $this->line('VAPID_PUBLIC_KEY=' . $keys['publicKey']);
            $this->line('VAPID_PRIVATE_KEY=' . $keys['privateKey']);
            $this->line('VAPID_SUBJECT=mailto:admin@dpar.com');
            $this->newLine();
            
            // Try to append to .env file
            $envPath = base_path('.env');
            if (file_exists($envPath)) {
                $envContent = file_get_contents($envPath);
                
                // Check if VAPID keys already exist
                if (strpos($envContent, 'VAPID_PUBLIC_KEY') === false) {
                    $vapidConfig = "\n# Web Push Notification VAPID Keys\n";
                    $vapidConfig .= "VAPID_PUBLIC_KEY={$keys['publicKey']}\n";
                    $vapidConfig .= "VAPID_PRIVATE_KEY={$keys['privateKey']}\n";
                    $vapidConfig .= "VAPID_SUBJECT=mailto:admin@dpar.com\n";
                    
                    file_put_contents($envPath, $envContent . $vapidConfig);
                    $this->info('✓ Keys have been added to your .env file');
                } else {
                    $this->warn('! VAPID keys already exist in .env file. Please update them manually if needed.');
                }
            }
            
            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Failed to generate VAPID keys: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }

    /**
     * Generate VAPID keys using OpenSSL
     */
    private function generateVapidKeys()
    {
        // Create a temporary directory for key files
        $tempDir = sys_get_temp_dir();
        $privateKeyFile = $tempDir . '/vapid_private.pem';
        $publicKeyFile = $tempDir . '/vapid_public.pem';

        try {
            // Generate EC private key
            exec("openssl ecparam -genkey -name prime256v1 -out {$privateKeyFile} 2>&1", $output, $returnVar);
            
            if ($returnVar !== 0) {
                throw new \Exception('Failed to generate private key');
            }

            // Extract public key
            exec("openssl ec -in {$privateKeyFile} -pubout -out {$publicKeyFile} 2>&1", $output, $returnVar);
            
            if ($returnVar !== 0) {
                throw new \Exception('Failed to extract public key');
            }

            // Read the keys
            $privateKey = file_get_contents($privateKeyFile);
            $publicKey = file_get_contents($publicKeyFile);

            // Clean up
            @unlink($privateKeyFile);
            @unlink($publicKeyFile);

            // Convert to base64url format for VAPID
            $privateKeyBase64 = $this->pemToBase64Url($privateKey, 'EC PRIVATE KEY');
            $publicKeyBase64 = $this->pemToBase64Url($publicKey, 'PUBLIC KEY');

            return [
                'publicKey' => $publicKeyBase64,
                'privateKey' => $privateKeyBase64
            ];
        } catch (\Exception $e) {
            // Clean up on error
            @unlink($privateKeyFile);
            @unlink($publicKeyFile);
            throw $e;
        }
    }

    /**
     * Convert PEM to base64url format
     */
    private function pemToBase64Url($pem, $keyType)
    {
        // Remove PEM headers and whitespace
        $pem = str_replace("-----BEGIN {$keyType}-----", '', $pem);
        $pem = str_replace("-----END {$keyType}-----", '', $pem);
        $pem = str_replace(["\r", "\n", ' '], '', $pem);
        
        // Decode base64
        $der = base64_decode($pem);
        
        // For public key, extract the last 65 bytes (uncompressed point)
        if ($keyType === 'PUBLIC KEY') {
            $der = substr($der, -65);
        }
        
        // Encode to base64url
        return rtrim(strtr(base64_encode($der), '+/', '-_'), '=');
    }
}
