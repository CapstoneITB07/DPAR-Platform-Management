<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class DatabaseRestore extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'db:restore {backup_file} {--force}';

    /**
     * The console command description.
     */
    protected $description = 'Restore database from a backup file';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $backupFile = $this->argument('backup_file');
        $backupPath = storage_path("app/backups/{$backupFile}");

        // Check if backup file exists
        if (!file_exists($backupPath)) {
            $this->error("Backup file not found: {$backupPath}");
            $this->info("\nAvailable backups:");
            $this->listBackups();
            return 1;
        }

        // Confirm restoration
        if (!$this->option('force')) {
            if (!$this->confirm('WARNING: This will overwrite the current database. Are you sure?')) {
                $this->info('Restore cancelled.');
                return 0;
            }
        }

        $this->info('Starting database restore...');

        try {
            // Get database credentials
            $database = config('database.connections.mysql.database');
            $username = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');
            $host = config('database.connections.mysql.host');
            $port = config('database.connections.mysql.port', 3306);

            // Handle compressed files
            $isCompressed = substr($backupFile, -3) === '.gz';
            $tempFile = $backupPath;

            if ($isCompressed) {
                $this->info('Decompressing backup...');
                $tempFile = storage_path('app/backups/temp_restore.sql');
                exec("gunzip -c {$backupPath} > {$tempFile}", $output, $returnVar);

                if ($returnVar !== 0) {
                    $this->error('Failed to decompress backup file!');
                    return 1;
                }
            }

            // Determine mysql path based on OS
            $mysql = 'mysql';
            if (PHP_OS_FAMILY === 'Windows') {
                // Check common Windows MySQL locations
                $windowsPaths = [
                    'C:\\xampp\\mysql\\bin\\mysql.exe',
                    'C:\\laragon\\bin\\mysql\\mysql-8.0.30\\bin\\mysql.exe',
                    'C:\\laragon\\bin\\mysql\\mysql-5.7.33\\bin\\mysql.exe',
                    'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe',
                ];

                foreach ($windowsPaths as $path) {
                    if (file_exists($path)) {
                        $mysql = $path;
                        break;
                    }
                }
            }

            // Build mysql restore command
            $command = sprintf(
                '%s --user=%s --password=%s --host=%s --port=%s %s < %s 2>&1',
                escapeshellarg($mysql),
                escapeshellarg($username),
                escapeshellarg($password),
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($database),
                escapeshellarg($tempFile)
            );

            // Execute restore
            exec($command, $output, $returnVar);

            // Clean up temp file if decompressed
            if ($isCompressed && file_exists($tempFile)) {
                unlink($tempFile);
            }

            if ($returnVar !== 0) {
                $this->error('Restore failed!');
                $this->error(implode("\n", $output));
                return 1;
            }

            $this->info('Database restored successfully!');
            $this->warn('Remember to clear cache and restart queue workers if needed.');

            return 0;
        } catch (\Exception $e) {
            $this->error('Restore error: ' . $e->getMessage());
            return 1;
        }
    }

    /**
     * List available backups
     */
    private function listBackups()
    {
        $backupDir = storage_path('app/backups');
        $files = glob("{$backupDir}/backup_*.sql*");

        if (empty($files)) {
            $this->warn('No backups found.');
            return;
        }

        rsort($files); // Show newest first

        foreach ($files as $file) {
            $filename = basename($file);
            $size = filesize($file);
            $date = date('Y-m-d H:i:s', filemtime($file));
            $this->line(sprintf('  %s (%s) - %s', $filename, $this->formatBytes($size), $date));
        }
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
