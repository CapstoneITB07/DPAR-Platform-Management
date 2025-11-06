<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Carbon\Carbon;

class ListBackups extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'db:backups {--stats}';

    /**
     * The console command description.
     */
    protected $description = 'List all available database backups';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $backupDir = storage_path('app/backups');

        if (!file_exists($backupDir)) {
            $this->warn('No backup directory found.');
            return 0;
        }

        $files = glob("{$backupDir}/backup_*.sql*");

        if (empty($files)) {
            $this->warn('No backups found.');
            return 0;
        }

        rsort($files); // Show newest first

        $this->info('Available Database Backups:');
        $this->line('');

        $headers = ['Filename', 'Size', 'Status', 'Created', 'Age'];
        $rows = [];
        $totalSize = 0;

        foreach ($files as $file) {
            $filename = basename($file);
            $size = filesize($file);
            $totalSize += $size;
            $created = Carbon::createFromTimestamp(filemtime($file));
            $age = $created->diffForHumans();
            
            // Check if file is encrypted
            $isEncrypted = substr($filename, -4) === '.enc';
            $status = $isEncrypted ? '🔒 Encrypted' : '⚠️ Unencrypted';

            $rows[] = [
                $filename,
                $this->formatBytes($size),
                $status,
                $created->format('Y-m-d H:i:s'),
                $age
            ];
        }

        $this->table($headers, $rows);

        if ($this->option('stats')) {
            $this->line('');
            $this->info('Statistics:');
            $this->line("Total Backups: " . count($files));
            $this->line("Total Size: " . $this->formatBytes($totalSize));
            $this->line("Backup Directory: {$backupDir}");
        }

        return 0;
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
