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

    /*
    |--------------------------------------------------------------------------
    | RELASI
    |--------------------------------------------------------------------------
    */
    public function laporans()
    {
        return $this->belongsToMany(Laporan::class, 'laporan_petugas')
            ->withPivot('status_tugas', 'catatan', 'dikirim_pada', 'is_active')
            ->withTimestamps();
    }

    /*
    |--------------------------------------------------------------------------
    | SCOPES
    |--------------------------------------------------------------------------
    */

    public function scopeAktif($query)
    {
        return $query->where('status', 'Aktif');
    }

// Di file Petugas.php, ganti scope tersedia dengan ini yang lebih aman:
public function scopeTersedia($query, $laporanId = null)
{
    return $query->where('status', 'Aktif')
        ->where(function($q) {
            // HANYA petugas yang TIDAK memiliki tugas aktif
            $q->whereDoesntHave('laporans', function($sub) {
                $sub->where('laporan_petugas.is_active', 1)
                    ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan']);
            });
        });
}

// Scope untuk petugas tersedia umum (tanpa mempertimbangkan laporan tertentu)
public function scopeTersediaUmum($query)
{
    return $this->scopeTersedia($query);
}

    public function scopeDalamTugas($query)
    {
        return $query->where('status', 'Aktif')
            ->whereHas('laporans', function ($q) {
                $q->wherePivot('is_active', 1)
                  ->whereIn('laporan_petugas.status_tugas', [
                      'Dikirim', 'Diterima', 'Dalam Pengerjaan'
                  ]);
            });
    }

    /*
    |--------------------------------------------------------------------------
    | LOGIC UTAMA
    |--------------------------------------------------------------------------
    */

    public function isDalamTugas()
    {
        return $this->laporans()
            ->where('laporan_petugas.is_active', 1)
            ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan'])
            ->exists();
    }

    public function isMenanganiLaporan($laporanId)
    {
        return $this->laporans()
            ->where('laporans.id', $laporanId)
            ->where('laporan_petugas.is_active', 1)
            ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan'])
            ->exists();
    }

    public function laporanDitangani()
    {
        return $this->laporans()
            ->wherePivot('is_active', 1)
            ->whereIn('laporan_petugas.status_tugas', [
                'Dikirim', 'Diterima', 'Dalam Pengerjaan'
            ])
            ->first();
    }

    /*
    |--------------------------------------------------------------------------
    | ATTRIBUTE (Status Penugasan)
    |--------------------------------------------------------------------------
    */

    public function getStatusPenugasanAttribute()
    {
        if ($this->status !== 'Aktif') {
            return 'Nonaktif';
        }

        return $this->isDalamTugas() ? 'Dalam Tugas' : 'Tersedia';
    }

    public function getStatusPenugasanColorAttribute()
    {
        return [
            'Tersedia' => 'success',
            'Dalam Tugas' => 'warning',
            'Nonaktif' => 'danger'
        ][$this->status_penugasan] ?? 'secondary';
    }
}
