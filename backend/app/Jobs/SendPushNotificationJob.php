<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Http\Controllers\PushNotificationController;
use Illuminate\Support\Facades\Log;

class SendPushNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 60;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public ?array $userIds,
        public string $title,
        public string $body,
        public array $data = []
    ) {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            PushNotificationController::sendNotification(
                $this->userIds,
                $this->title,
                $this->body,
                $this->data
            );
        } catch (\Exception $e) {
            Log::error('Push notification job failed: ' . $e->getMessage(), [
                'userIds' => $this->userIds,
                'title' => $this->title,
                'exception' => $e
            ]);
            throw $e; // Re-throw to trigger retry mechanism
        }
    }
}

