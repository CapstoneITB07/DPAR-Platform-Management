<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $fillable = [
        'title',
        'description',
        'photos',
    ];

    protected $casts = [
        'photos' => 'array',
    ];
}
