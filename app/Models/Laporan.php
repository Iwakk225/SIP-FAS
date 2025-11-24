<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Laporan extends Model
{
    use HasFactory;

    protected $fillable = [
        'judul',
        'lokasi', 
        'deskripsi',
        'kategori',
        'pelapor_nama',
        'pelapor_email',
        'pelapor_telepon',
        'foto_laporan',
        'foto_bukti_perbaikan',
        'rincian_biaya_pdf',
        'status',
        'alasan_penolakan'
    ];

    protected $casts = [
        'foto_laporan' => 'array',
        'foto_bukti_perbaikan' => 'array'
    ];

    // Relasi many-to-many dengan petugas
    public function petugas()
    {
        return $this->belongsToMany(Petugas::class, 'laporan_petugas')
                    ->withPivot('status_tugas', 'catatan', 'dikirim_pada')
                    ->withTimestamps();
    }

    // Cek apakah laporan sudah memiliki petugas
    public function hasPetugas()
    {
        return $this->petugas()->exists();
    }

    // Get petugas yang sedang menangani laporan ini
    public function petugasAktif()
    {
        return $this->petugas()->wherePivotIn('status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan']);
    }
}