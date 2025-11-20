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
}