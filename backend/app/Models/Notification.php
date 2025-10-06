<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Notification extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'created_by', // admin user id
        'expertise_requirements',
        'status',
    ];

    protected $casts = [
        'expertise_requirements' => 'array',
    ];

    public function recipients()
    {
        return $this->hasMany(NotificationRecipient::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
