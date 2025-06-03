<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User; // Import the User model
use Illuminate\Support\Facades\Hash; // Import the Hash facade

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Head Admin Account
        User::create([
            'name' => 'Head Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'), // Replace 'password' with a strong password
            'role' => 'head_admin',
        ]);

        // Create 15 Associate Group Leader Accounts
        $associateLeaders = [
            // Replace with actual names and emails for your 15 associate leaders
            ['name' => 'Associate Leader 1', 'email' => 'associate1@example.com'],
            ['name' => 'Associate Leader 2', 'email' => 'associate2@example.com'],
            ['name' => 'Associate Leader 3', 'email' => 'associate3@example.com'],
            ['name' => 'Associate Leader 4', 'email' => 'associate4@example.com'],
            ['name' => 'Associate Leader 5', 'email' => 'associate5@example.com'],
            ['name' => 'Associate Leader 6', 'email' => 'associate6@example.com'],
            ['name' => 'Associate Leader 7', 'email' => 'associate7@example.com'],
            ['name' => 'Associate Leader 8', 'email' => 'associate8@example.com'],
            ['name' => 'Associate Leader 9', 'email' => 'associate9@example.com'],
            ['name' => 'Associate Leader 10', 'email' => 'associate10@example.com'],
            ['name' => 'Associate Leader 11', 'email' => 'associate11@example.com'],
            ['name' => 'Associate Leader 12', 'email' => 'associate12@example.com'],
            ['name' => 'Associate Leader 13', 'email' => 'associate13@example.com'],
            ['name' => 'Associate Leader 14', 'email' => 'associate14@example.com'],
        ];

        foreach ($associateLeaders as $leader) {
            User::create([
                'name' => $leader['name'],
                'email' => $leader['email'],
                'password' => Hash::make('password'), // Replace 'password' with a strong password
                'role' => 'associate_group_leader',
            ]);
        }
    }
}
