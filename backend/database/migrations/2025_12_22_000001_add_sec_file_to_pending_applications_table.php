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
        Schema::table('pending_applications', function (Blueprint $table) {
            $table->string('sec_file')->nullable()->after('sec_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pending_applications', function (Blueprint $table) {
            $table->dropColumn('sec_file');
        });
    }
};
