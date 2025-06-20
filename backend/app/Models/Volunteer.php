<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Volunteer extends Model
{
    use HasFactory;

    protected $fillable = [
        'associate_group_id',
        'name',
        'gender',
        'address',
        'contact_info',
        'expertise',
        'location'
    ];

    public function associateGroup()
    {
        return $this->belongsTo(AssociateGroup::class);
    }
}
