<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User; // Import the User model
use App\Models\Evaluation;
use Illuminate\Support\Facades\Hash; // Import the Hash facade

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Head Admin Account
        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Head Admin',
                'password' => Hash::make('password'), // Replace 'password' with a strong password
                'role' => 'head_admin',
            ]
        );

        // Create 15 Associate Group Leader Accounts with their respective organizations
        $associateLeaders = [
            ['name' => 'Associate Leader 1', 'email' => 'associate1@example.com', 'organization' => 'AKLMV'],
            ['name' => 'Associate Leader 2', 'email' => 'associate2@example.com', 'organization' => 'ALERT'],
            ['name' => 'Associate Leader 3', 'email' => 'associate3@example.com', 'organization' => 'CCVOL'],
            ['name' => 'Associate Leader 4', 'email' => 'associate4@example.com', 'organization' => 'CRRG'],
            ['name' => 'Associate Leader 5', 'email' => 'associate5@example.com', 'organization' => 'DRRM-Y'],
            ['name' => 'Associate Leader 6', 'email' => 'associate6@example.com', 'organization' => 'FRONTLINER'],
            ['name' => 'Associate Leader 7', 'email' => 'associate7@example.com', 'organization' => 'JKM'],
            ['name' => 'Associate Leader 8', 'email' => 'associate8@example.com', 'organization' => 'KAIC'],
            ['name' => 'Associate Leader 9', 'email' => 'associate9@example.com', 'organization' => 'MRAP'],
            ['name' => 'Associate Leader 10', 'email' => 'associate10@example.com', 'organization' => 'MSG-ERU'],
            ['name' => 'Associate Leader 11', 'email' => 'associate11@example.com', 'organization' => 'PCGA 107th'],
            ['name' => 'Associate Leader 12', 'email' => 'associate12@example.com', 'organization' => 'RMFB'],
            ['name' => 'Associate Leader 13', 'email' => 'associate13@example.com', 'organization' => 'SPAG'],
            ['name' => 'Associate Leader 14', 'email' => 'associate14@example.com', 'organization' => 'SRG'],
            ['name' => 'Associate Leader 15', 'email' => 'associate15@example.com', 'organization' => 'TF'],
        ];

        foreach ($associateLeaders as $leader) {
            $user = User::firstOrCreate(
                ['email' => $leader['email']],
                [
                    'name' => $leader['name'],
                    'password' => Hash::make('password'),
                    'role' => 'associate_group_leader',
                    'organization' => $leader['organization'],
                ]
            );
        }

        // Seed associate_groups for each leader
        $this->call(AssociateGroupSeeder::class);
    }
}
