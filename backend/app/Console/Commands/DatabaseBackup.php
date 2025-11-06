<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Crypt;
use Carbon\Carbon;

class DatabaseBackup extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'db:backup {--compress} {--keep-days=30}';

    /**
     * The console command description.
     */
    protected $description = 'Backup the database with compression and retention policy';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting database backup...');

        try {
            // Get database credentials
            $database = config('database.connections.mysql.database');
            $username = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');
            $host = config('database.connections.mysql.host');
            $port = config('database.connections.mysql.port', 3306);

            // Create backup filename with timestamp
            $timestamp = Carbon::now()->format('Y-m-d_H-i-s');
            $filename = "backup_{$database}_{$timestamp}.sql";
            $backupPath = storage_path("app/backups/{$filename}");

            // Ensure backup directory exists with secure permissions
            $backupDir = storage_path('app/backups');
            if (!file_exists($backupDir)) {
                mkdir($backupDir, 0700, true);
            } else {
                // Ensure existing directory has secure permissions
                chmod($backupDir, 0700);
            }

            // Determine mysqldump path based on OS
            $mysqldump = 'mysqldump';
            if (PHP_OS_FAMILY === 'Windows') {
                // Check common Windows MySQL locations
                $windowsPaths = [
                    'C:\\xampp\\mysql\\bin\\mysqldump.exe',
                    'C:\\laragon\\bin\\mysql\\mysql-8.0.30\\bin\\mysqldump.exe',
                    'C:\\laragon\\bin\\mysql\\mysql-5.7.33\\bin\\mysqldump.exe',
                    'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
                ];

                foreach ($windowsPaths as $path) {
                    if (file_exists($path)) {
                        $mysqldump = $path;
                        break;
                    }
                }
            }

            // Build mysqldump command
            $command = sprintf(
                '%s --user=%s --password=%s --host=%s --port=%s %s > %s 2>&1',
                escapeshellarg($mysqldump),
                escapeshellarg($username),
                escapeshellarg($password),
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($database),
                escapeshellarg($backupPath)
            );

            // Execute backup
            exec($command, $output, $returnVar);

            if ($returnVar !== 0) {
                $this->error('Backup failed!');
                $this->error(implode("\n", $output));
                return 1;
            }

            // Check if file was created
            if (!file_exists($backupPath)) {
                $this->error('Backup file was not created!');
                return 1;
            }

            $fileSize = filesize($backupPath);
            $this->info("Backup created successfully: {$filename}");
            $this->info("Size: " . $this->formatBytes($fileSize));

            // Compress if option is set
            if ($this->option('compress')) {
                $this->info('Compressing backup...');
                $gzipPath = $backupPath . '.gz';

                exec("gzip -c {$backupPath} > {$gzipPath}", $output, $returnVar);

                if ($returnVar === 0 && file_exists($gzipPath)) {
                    unlink($backupPath); // Remove uncompressed file
                    $backupPath = $gzipPath;
                    $filename .= '.gz';
                    $compressedSize = filesize($gzipPath);
                    $this->info("Compressed to: " . $this->formatBytes($compressedSize));
                }
            }

            // Encrypt the backup file for security
            $this->info('Encrypting backup...');
            $encryptedPath = $backupPath . '.enc';
            
            try {
                // Read the backup file content
                $backupContent = file_get_contents($backupPath);
                
                // Encrypt using Laravel's Crypt (AES-256-CBC)
                $encryptedContent = Crypt::encryptString($backupContent);
                
                // Write encrypted content to new file
                file_put_contents($encryptedPath, $encryptedContent);
                
                // Set secure file permissions (read/write for owner only)
                chmod($encryptedPath, 0600);
                
                // Remove unencrypted file
                unlink($backupPath);
                
                $backupPath = $encryptedPath;
                $filename .= '.enc';
                $encryptedSize = filesize($encryptedPath);
                $this->info("Encrypted backup created: " . $this->formatBytes($encryptedSize));
            } catch (\Exception $e) {
                $this->error('Encryption failed: ' . $e->getMessage());
                $this->warn('Backup file remains unencrypted. Please encrypt manually.');
            }

            // Clean up old backups based on retention policy
            $keepDays = $this->option('keep-days');
            $this->cleanOldBackups($keepDays);

            // Log the backup (use final file size)
            $finalSize = filesize($backupPath);
            $this->logBackup($filename, $finalSize);

            $this->info('Backup completed successfully!');
            $this->info("Location: {$backupPath}");

            return 0;
        } catch (\Exception $e) {
            $this->error('Backup error: ' . $e->getMessage());
            return 1;
        }
    }

    /**
     * Clean up old backup files
     */
    private function cleanOldBackups($keepDays)
    {
        $this->info("Cleaning backups older than {$keepDays} days...");

        $backupDir = storage_path('app/backups');
        $files = glob("{$backupDir}/backup_*.sql*");
        $cutoffTime = Carbon::now()->subDays($keepDays)->timestamp;
        $deletedCount = 0;

        foreach ($files as $file) {
            if (filemtime($file) < $cutoffTime) {
                unlink($file);
                $deletedCount++;
            }
        }

        if ($deletedCount > 0) {
            $this->info("Deleted {$deletedCount} old backup(s)");
        }
    }

    /**
     * Log backup information
     */
    private function logBackup($filename, $fileSize)
    {
        $logFile = storage_path('app/backups/backup_log.txt');
        $logEntry = sprintf(
            "[%s] Backup created: %s (Size: %s)\n",
            Carbon::now()->toDateTimeString(),
            $filename,
            $this->formatBytes($fileSize)
        );
        file_put_contents($logFile, $logEntry, FILE_APPEND);
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
