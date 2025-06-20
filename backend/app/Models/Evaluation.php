<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Evaluation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'evaluation_data',
        'total_score'
    ];

    protected $casts = [
        'evaluation_data' => 'array',
        'total_score' => 'float'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
