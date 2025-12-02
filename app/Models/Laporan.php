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
        return $this->petugas()
                    ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan'])
                    ->withPivot('status_tugas', 'catatan', 'dikirim_pada');
    }

    // Get status tugas untuk laporan ini (jika ada petugas)
    public function getStatusTugasAttribute()
    {
        $petugasAktif = $this->petugasAktif()->first();
        return $petugasAktif ? $petugasAktif->pivot->status_tugas : null;
    }

    // Get petugas pertama yang menangani laporan
    public function petugasPertama()
    {
        return $this->petugas()
                    ->orderBy('laporan_petugas.created_at')
                    ->first();
    }

    // Scope untuk laporan yang sudah ditugaskan ke petugas
    public function scopeDitugaskan($query)
    {
        return $query->whereHas('petugas', function($q) {
            $q->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan']);
        });
    }

    // Scope untuk laporan yang belum ditugaskan
    public function scopeBelumDitugaskan($query)
    {
        return $query->whereDoesntHave('petugas', function($q) {
            $q->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan']);
        });
    }

    // Update status tugas petugas di laporan ini
    public function updateStatusTugasPetugas($petugasId, $statusTugas, $catatan = null)
    {
        return $this->petugas()->updateExistingPivot($petugasId, [
            'status_tugas' => $statusTugas,
            'catatan' => $catatan
        ]);
    }
}