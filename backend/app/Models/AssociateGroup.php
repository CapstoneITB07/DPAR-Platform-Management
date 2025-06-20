<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssociateGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'organization',
        'logo',
        'user_id',
        'status'
    ];

    protected $appends = ['members_count'];

    public function getMembersCountAttribute()
    {
        return $this->volunteers()->count();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function volunteers()
    {
        return $this->hasMany(Volunteer::class);
    }
}
