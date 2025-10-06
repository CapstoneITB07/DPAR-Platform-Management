<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TrainingProgram extends Model
{
    use SoftDeletes;
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
