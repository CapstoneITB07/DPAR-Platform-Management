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
    ];

    protected $casts = [
        'photos' => 'array',
    ];
}
