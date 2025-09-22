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
        Schema::create('director_achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('director_history_id')->constrained('director_histories')->onDelete('cascade');
            $table->string('title');
            $table->text('description');
            $table->string('achievement_type');
            $table->integer('points_earned')->default(0);
            $table->string('badge_icon')->nullable();
            $table->string('badge_color')->nullable();
            $table->boolean('is_milestone')->default(false);
            $table->timestamp('achieved_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('director_achievements');
    }
};
