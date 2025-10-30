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
            ['email' => 'dparvc1@gmail.com'],
            [
                'name' => 'Head Admin',
                'username' => 'headadmin', // username used for login
                'password' => Hash::make('password'), // Replace 'password' with a strong password
                'role' => 'head_admin',
            ]
        );
    }
}
