<?php

namespace App\Console\Commands;

use App\Models\SystemSettings;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckAndBackup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:backup-check 
                            {--force : Force backup even if disabled in settings}
                            {--compress : Compress the backup file}
                            {--keep-days=30 : Number of days to keep backups}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check system settings and run database backup if enabled';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Check if auto_backup is enabled (unless --force flag is used)
        if (!$this->option('force')) {
            $autoBackup = SystemSettings::getValue('auto_backup', true);
            
            if (!$autoBackup) {
                $this->warn('⚠️  Automatic backups are disabled in system settings.');
                $this->info('To run backup anyway, use: php artisan db:backup-check --force');
                $this->info('Or enable "Automatic Backups" in System Settings.');
                
                Log::info('Backup skipped: auto_backup setting is disabled', [
                    'command' => 'db:backup-check',
                    'forced' => false
                ]);
                
                return 0; // Exit successfully (not an error, just skipped)
            }
        } else {
            $this->info('⚠️  Force flag detected - running backup despite settings.');
        }

        $this->info('✅ Automatic backups are enabled. Running backup...');
        $this->newLine();

        // Build command options
        $options = [];
        if ($this->option('compress')) {
            $options['--compress'] = true;
        }
        $options['--keep-days'] = $this->option('keep-days');

        // Call the actual backup command
        try {
            $exitCode = $this->call('db:backup', $options);
            
            if ($exitCode === 0) {
                Log::info('Backup completed successfully via db:backup-check', [
                    'forced' => $this->option('force'),
                    'compressed' => $this->option('compress'),
                    'keep_days' => $this->option('keep-days')
                ]);
            }
            
            return $exitCode;
        } catch (\Exception $e) {
            $this->error('Backup command failed: ' . $e->getMessage());
            Log::error('Backup command failed in db:backup-check', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return 1;
        }
    }
}
