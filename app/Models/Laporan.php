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
        'foto_bukti_perbaikan' => 'array',
        'alasan_penolakan' => 'string'
    ];

    /*
    |--------------------------------------------------------------------------
    | RELASI
    |--------------------------------------------------------------------------
    */
    public function petugas()
    {
        return $this->belongsToMany(Petugas::class, 'laporan_petugas')
            ->withPivot('status_tugas', 'catatan', 'dikirim_pada', 'is_active')
            ->withTimestamps();
    }

    /*
    |--------------------------------------------------------------------------
    | LOGIC LAPORAN
    |--------------------------------------------------------------------------
    */

    // Laporan punya petugas aktif?
    public function hasPetugas()
    {
        return $this->petugas()
            ->wherePivot('is_active', 1)
            ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan'])
            ->exists();
    }

    // Ambil petugas yang sedang aktif di laporan
    public function petugasAktif()
    {
        return $this->petugas()
            ->wherePivot('is_active', 1)
            ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan']);
    }

    // Status tugas laporan dari pivot aktif
    public function getStatusTugasAttribute()
    {
        $pivot = $this->petugasAktif()->first();
        return $pivot ? $pivot->pivot->status_tugas : null;
    }

    // Update status tugas di pivot
    public function updateStatusTugasPetugas($petugasId, $statusTugas, $catatan = null)
    {
        return $this->petugas()->updateExistingPivot($petugasId, [
            'status_tugas' => $statusTugas,
            'catatan' => $catatan
        ]);
    }
}
