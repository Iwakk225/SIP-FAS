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

    // Scope untuk petugas yang tersedia (tidak sedang dalam tugas)
    public function scopeTersedia($query)
    {
        return $query->where('status', 'Aktif')
                    ->whereDoesntHave('laporans', function($q) {
                        $q->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan']);
                    });
    }

    // Scope untuk petugas yang sedang dalam tugas
    public function scopeDalamTugas($query)
    {
        return $query->where('status', 'Aktif')
                    ->whereHas('laporans', function($q) {
                        $q->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan']);
                    });
    }

    // Cek apakah petugas sedang dalam tugas
    public function isDalamTugas()
    {
        return $this->laporans()
                    ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan'])
                    ->exists();
    }

    // Get laporan yang sedang ditangani oleh petugas
    public function laporanDitangani()
    {
        return $this->laporans()
                    ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan'])
                    ->withPivot('status_tugas', 'catatan', 'dikirim_pada')
                    ->first();
    }

    // Get status penugasan petugas
    public function getStatusPenugasanAttribute()
    {
        if ($this->status !== 'Aktif') {
            return 'Nonaktif';
        }

        return $this->isDalamTugas() ? 'Dalam Tugas' : 'Tersedia';
    }

    // Get warna untuk status penugasan
    public function getStatusPenugasanColorAttribute()
    {
        $status = $this->status_penugasan;
        
        if ($status === 'Tersedia') return 'success';
        if ($status === 'Dalam Tugas') return 'warning';
        if ($status === 'Nonaktif') return 'danger';
        
        return 'secondary';
    }
}