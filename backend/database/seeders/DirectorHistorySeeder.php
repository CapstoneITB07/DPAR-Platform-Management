<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AssociateGroup;
use App\Models\DirectorHistory;
use Carbon\Carbon;

class DirectorHistorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all existing associate groups
        $associateGroups = AssociateGroup::all();

        foreach ($associateGroups as $group) {
            // Create initial director history for existing groups
            DirectorHistory::create([
                'associate_group_id' => $group->id,
                'director_name' => $group->director ?? 'Unknown Director',
                'director_email' => $group->email,
                'contributions' => 'Initial director of the organization',
                'volunteers_recruited' => $group->volunteers()->count(),
                'events_organized' => 0, // Default value
                'start_date' => $group->created_at->toDateString(),
                'is_current' => true
            ]);
        }
    }
}
