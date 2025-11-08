<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('laporans', function (Blueprint $table) {
            $table->id();
            $table->string('judul');
            $table->text('lokasi');
            $table->text('deskripsi');
            $table->string('kategori')->nullable();
            $table->string('pelapor_nama');
            $table->string('pelapor_email')->nullable();
            $table->string('pelapor_telepon')->nullable();
            $table->string('status')->default('Validasi');
            $table->string('foto')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('laporans');
    }
};