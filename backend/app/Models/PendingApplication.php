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
        'username',
        'email',
        'phone',
        'password',
        'logo',
        'interview_proof',
        'description',
        'status',
        'approved_at',
        'otp_code',
        'otp_expires_at',
        'sec_number',
        'sec_file',
        'accept_terms',
        'accept_privacy',
        'terms_accepted_at',
        'privacy_accepted_at'
    ];

    protected $hidden = [
        'password',
        'otp_code'
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'otp_expires_at' => 'datetime',
        'terms_accepted_at' => 'datetime',
        'privacy_accepted_at' => 'datetime',
        'password' => 'hashed',
        'accept_terms' => 'boolean',
        'accept_privacy' => 'boolean'
    ];
}
