<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('activity_type'); // 'login', 'notification_accepted', 'report_submitted', 'notification_declined'
            $table->string('description')->nullable();
            $table->json('metadata')->nullable(); // Additional data like notification_id, report_id, etc.
            $table->timestamp('activity_at')->useCurrent();
            $table->timestamps();

            $table->index(['user_id', 'activity_type']);
            $table->index(['activity_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
