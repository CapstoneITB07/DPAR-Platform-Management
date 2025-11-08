<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, remove any duplicate records (keep the first one)
        DB::statement('
            DELETE nr1 FROM notification_recipients nr1
            INNER JOIN notification_recipients nr2 
            WHERE nr1.id > nr2.id 
            AND nr1.notification_id = nr2.notification_id 
            AND nr1.user_id = nr2.user_id
        ');

        // Check if the unique constraint already exists before adding it
        $constraintExists = DB::select("
            SELECT COUNT(*) as count
            FROM information_schema.table_constraints
            WHERE constraint_schema = DATABASE()
            AND table_name = 'notification_recipients'
            AND constraint_name = 'notification_recipients_notification_user_unique'
        ");

        // Only add the constraint if it doesn't exist
        if ($constraintExists[0]->count == 0) {
            Schema::table('notification_recipients', function (Blueprint $table) {
                // Add unique constraint to prevent duplicate responses
                // This ensures one user can only have one recipient record per notification
                $table->unique(['notification_id', 'user_id'], 'notification_recipients_notification_user_unique');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Check if the unique constraint exists before dropping it
        $constraintExists = DB::select("
            SELECT COUNT(*) as count
            FROM information_schema.table_constraints
            WHERE constraint_schema = DATABASE()
            AND table_name = 'notification_recipients'
            AND constraint_name = 'notification_recipients_notification_user_unique'
        ");

        // Only drop the constraint if it exists
        if ($constraintExists[0]->count > 0) {
            Schema::table('notification_recipients', function (Blueprint $table) {
                $table->dropUnique('notification_recipients_notification_user_unique');
            });
        }
    }
};
