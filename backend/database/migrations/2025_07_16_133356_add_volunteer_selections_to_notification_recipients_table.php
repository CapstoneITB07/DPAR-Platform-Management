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
        Schema::table('notification_recipients', function (Blueprint $table) {
            $table->json('volunteer_selections')->nullable()->after('response');
            // volunteer_selections will store: [{"expertise": "Medical", "count": 5}, {"expertise": "Rescue", "count": 3}]
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notification_recipients', function (Blueprint $table) {
            $table->dropColumn('volunteer_selections');
        });
    }
};
