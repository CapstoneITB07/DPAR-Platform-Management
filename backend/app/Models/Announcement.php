<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Announcement extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'title',
        'description',
        'photos',
        'visible_to_citizens',
        'featured',
    ];

    protected $casts = [
        'photos' => 'array',
        'visible_to_citizens' => 'boolean',
        'featured' => 'boolean',
    ];
}
