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
            $table->boolean('accept_terms')->default(false)->after('sec_number');
            $table->boolean('accept_privacy')->default(false)->after('accept_terms');
            $table->timestamp('terms_accepted_at')->nullable()->after('accept_privacy');
            $table->timestamp('privacy_accepted_at')->nullable()->after('terms_accepted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pending_applications', function (Blueprint $table) {
            $table->dropColumn(['accept_terms', 'accept_privacy', 'terms_accepted_at', 'privacy_accepted_at']);
        });
    }
};
