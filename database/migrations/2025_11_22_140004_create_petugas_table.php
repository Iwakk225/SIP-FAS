<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('petugas', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->text('alamat');
            $table->string('nomor_telepon');
            $table->enum('status', ['Aktif', 'Nonaktif'])->default('Aktif');
            $table->timestamps();
        });

        // Tabel pivot untuk relasi banyak-ke-banyak antara laporan dan petugas
        Schema::create('laporan_petugas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('laporan_id')->constrained()->onDelete('cascade');
            $table->foreignId('petugas_id')->constrained()->onDelete('cascade');
            $table->timestamp('dikirim_pada')->useCurrent();
            $table->enum('status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan', 'Selesai'])->default('Dikirim');
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('laporan_petugas');
        Schema::dropIfExists('petugas');
    }
};