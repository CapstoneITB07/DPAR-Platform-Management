<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Volunteer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'associate_group_id',
        'name',
        'gender',
        'address',
        'contact_info',
        'expertise'
    ];

    public function associateGroup()
    {
        return $this->belongsTo(AssociateGroup::class);
    }
}
