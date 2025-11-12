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
        Schema::table('announcements', function (Blueprint $table) {
            $table->boolean('visible_to_citizens')->default(true)->after('description');
            $table->boolean('featured')->default(false)->after('visible_to_citizens');
        });

        Schema::table('training_programs', function (Blueprint $table) {
            $table->boolean('visible_to_citizens')->default(true)->after('description');
            $table->boolean('featured')->default(false)->after('visible_to_citizens');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn(['visible_to_citizens', 'featured']);
        });

        Schema::table('training_programs', function (Blueprint $table) {
            $table->dropColumn(['visible_to_citizens', 'featured']);
        });
    }
};

