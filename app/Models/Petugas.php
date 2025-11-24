<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Petugas extends Model
{
    use HasFactory;

    protected $table = 'petugas';
    
    protected $fillable = [
        'nama',
        'alamat', 
        'nomor_telepon',
        'status'
    ];

    protected $casts = [
        'status' => 'string'
    ];

    // Relasi many-to-many dengan laporan
    public function laporans()
    {
        return $this->belongsToMany(Laporan::class, 'laporan_petugas')
                    ->withPivot('status_tugas', 'catatan', 'dikirim_pada')
                    ->withTimestamps();
    }

    // Scope untuk petugas aktif
    public function scopeAktif($query)
    {
        return $query->where('status', 'Aktif');
    }
}