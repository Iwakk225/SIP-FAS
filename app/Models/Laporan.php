<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Laporan extends Model
{
    use HasFactory;

    protected $fillable = [
        'judul',
        'lokasi',
        'deskripsi',
        'kategori',
        'pelapor_nama',       // tetap ada (opsional untuk kompatibilitas)
        'pelapor_email',      // tetap ada (opsional)
        'pelapor_telepon',    // tetap ada (opsional)
        'foto_laporan',
        'foto_bukti_perbaikan',
        'rincian_biaya_pdf',
        'status',
        'alasan_penolakan',
        'user_id',            // 🔑 kolom utama kepemilikan
    ];

    protected $casts = [
        'foto_laporan' => 'array',
        'foto_bukti_perbaikan' => 'array',
        'alasan_penolakan' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | RELATIONS
    |--------------------------------------------------------------------------
    */

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function petugas(): BelongsToMany
    {
        return $this->belongsToMany(Petugas::class, 'laporan_petugas')
            ->withPivot('status_tugas', 'catatan', 'dikirim_pada', 'is_active')
            ->withTimestamps();
    }

    public function ratings(): HasMany
    {
        return $this->hasMany(Rating::class);
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */

    public function getAvgRatingAttribute()
    {
        return $this->ratings()->avg('rating') ?? 0;
    }

    public function getRatingsCountAttribute()
    {
        return $this->ratings()->count();
    }

    public function getStatusTugasAttribute()
    {
        $pivot = $this->petugasAktif()->first();
        return $pivot?->pivot->status_tugas;
    }

    /*
    |--------------------------------------------------------------------------
    | SCOPES & LOGIC
    |--------------------------------------------------------------------------
    */

    public function scopeMilikUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function hasPetugas()
    {
        return $this->petugas()
            ->wherePivot('is_active', 1)
            ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan'])
            ->exists();
    }

    public function petugasAktif()
    {
        return $this->petugas()
            ->wherePivot('is_active', 1)
            ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan']);
    }

    public function updateStatusTugasPetugas($petugasId, $statusTugas, $catatan = null)
    {
        return $this->petugas()->updateExistingPivot($petugasId, [
            'status_tugas' => $statusTugas,
            'catatan' => $catatan
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | HELPER
    |--------------------------------------------------------------------------
    */

    public function belongsToUser($user): bool
    {
        return $this->user_id === $user->id;
    }
}