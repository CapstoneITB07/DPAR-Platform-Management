<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingProgram extends Model
{
    protected $fillable = [
        'name',
        'date',
        'location',
        'description',
        'photos',
    ];

    protected $casts = [
        'photos' => 'array',
    ];
}
