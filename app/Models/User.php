<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Notifications\PasswordResetCodeNotification; // Tambahkan ini

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'status', // TAMBAHKAN INI
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    // Ganti method ini untuk menggunakan kode verifikasi
    public function sendPasswordResetNotification($token)
    {
        // Generate random 6 digit code
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Simpan ke database
        PasswordResetCode::create([
            'email' => $this->email,
            'code' => $code,
            'expires_at' => now()->addMinutes(5)
        ]);

        // Kirim email dengan kode
        $this->notify(new PasswordResetCodeNotification($code));
    }

    // TAMBAHKAN RELASI KE LAPORAN (jika belum ada)
    // public function laporans()
    // {
    //     return $this->hasMany(Laporan::class, 'user_id');
    // }
}