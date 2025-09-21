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
        Schema::create('director_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('associate_group_id')->constrained('associate_groups')->onDelete('cascade');
            $table->string('director_name');
            $table->string('director_email')->nullable();
            $table->text('contributions')->nullable(); // Description of contributions
            $table->integer('volunteers_recruited')->default(0); // Number of volunteers recruited
            $table->integer('reports_submitted')->default(0); // Number of reports submitted
            $table->integer('notifications_responded')->default(0); // Number of notifications responded to
            $table->integer('logins')->default(0); // Number of system logins
            $table->integer('events_organized')->default(0); // Number of events organized
            $table->date('start_date'); // When they became director
            $table->date('end_date')->nullable(); // When they left (null if current)
            $table->boolean('is_current')->default(false); // Whether they are the current director
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('director_histories');
    }
};
