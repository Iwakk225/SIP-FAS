<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Auth;

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
        'alasan_penolakan',
        'user_id', 
    ];

    protected $casts = [
        'foto_laporan' => 'array',
        'foto_bukti_perbaikan' => 'array',
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
        return $this->hasMany(Rating::class, 'laporan_id');
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */

    // Ambil rating dari user yang sedang login
    public function getUserRatingAttribute()
    {
        if (!Auth::check()) {
            return null;
        }

        return $this->ratings()
            ->where('user_id', Auth::id())
            ->first()?->rating; // return angka 1-5 atau null
    }

    // Ambil komentar rating user
    public function getUserRatingCommentAttribute()
    {
        if (!Auth::check()) {
            return null;
        }

        return $this->ratings()
            ->where('user_id', Auth::id())
            ->first()?->comment;
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