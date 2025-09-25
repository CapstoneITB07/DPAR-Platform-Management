<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PendingApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_name',
        'organization_type',
        'director_name',
        'email',
        'phone',
        'password',
        'logo',
        'status',
        'approved_at',
        'otp_code',
        'otp_expires_at'
    ];

    protected $hidden = [
        'password',
        'otp_code'
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'otp_expires_at' => 'datetime',
        'password' => 'hashed'
    ];
}
