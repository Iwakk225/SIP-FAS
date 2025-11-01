<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PasswordResetCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'code',
        'expires_at'
    ];

    // Nonaktifkan timestamps karena tidak butuh updated_at
    public $timestamps = false;

    protected $casts = [
        'expires_at' => 'datetime'
    ];

    public function isValid()
    {
        return !$this->isExpired();
    }

    public function isExpired()
    {
        return $this->expires_at && $this->expires_at->isPast();
    }
}