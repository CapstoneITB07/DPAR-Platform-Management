<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationRecipient extends Model
{
    use HasFactory;

    protected $fillable = [
        'notification_id',
        'user_id',
        'response', // accept, decline, volunteer_selection
        'volunteer_selections', // JSON array of volunteer selections with counts
        'responded_at',
    ];

    protected $casts = [
        'volunteer_selections' => 'array',
    ];

    public function notification()
    {
        return $this->belongsTo(Notification::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
