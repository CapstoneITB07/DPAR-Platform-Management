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
        Schema::create('citizen_analytics', function (Blueprint $table) {
            $table->id();
            $table->string('page_path'); // e.g., '/citizen', '/citizen/about', '/citizen/mitigation'
            $table->string('content_type')->nullable(); // 'announcement', 'training_program', 'page'
            $table->unsignedBigInteger('content_id')->nullable(); // ID of announcement or training program
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->string('referrer')->nullable();
            $table->timestamp('viewed_at')->useCurrent();
            $table->timestamps();

            $table->index(['page_path', 'viewed_at']);
            $table->index(['content_type', 'content_id']);
            $table->index('viewed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('citizen_analytics');
    }
};

