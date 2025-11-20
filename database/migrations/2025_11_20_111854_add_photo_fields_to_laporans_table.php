<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('laporans', function (Blueprint $table) {
            $table->json('foto_laporan')->nullable()->after('pelapor_telepon');
            $table->json('foto_bukti_perbaikan')->nullable()->after('foto_laporan');
            $table->string('rincian_biaya_pdf')->nullable()->after('foto_bukti_perbaikan');
        });
    }

    public function down()
    {
        Schema::table('laporans', function (Blueprint $table) {
            $table->dropColumn(['foto_laporan', 'foto_bukti_perbaikan', 'rincian_biaya_pdf']);
        });
    }
};