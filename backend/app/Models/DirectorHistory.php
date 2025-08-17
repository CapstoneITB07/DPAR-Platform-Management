<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DirectorHistory extends Model
{
    protected $fillable = [
        'associate_group_id',
        'director_name',
        'director_email',
        'contributions',
        'volunteers_recruited',
        'events_organized',
        'start_date',
        'end_date',
        'reason_for_leaving',
        'is_current'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_current' => 'boolean',
        'volunteers_recruited' => 'integer',
        'events_organized' => 'integer'
    ];

    /**
     * Get the associate group that this director history belongs to
     */
    public function associateGroup(): BelongsTo
    {
        return $this->belongsTo(AssociateGroup::class);
    }

    /**
     * Scope to get only current directors
     */
    public function scopeCurrent($query)
    {
        return $query->where('is_current', true);
    }

    /**
     * Scope to get only former directors
     */
    public function scopeFormer($query)
    {
        return $query->where('is_current', false);
    }
}
