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
        'pelapor_nama',
        'pelapor_email',
        'pelapor_telepon',
        'status',
        'foto'
    ];

    protected $attributes = [
        'status' => 'Validasi'
    ];
}