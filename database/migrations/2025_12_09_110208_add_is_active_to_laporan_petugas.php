<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('laporan_petugas', function (Blueprint $table) {
            $table->boolean('is_active')->default(1)->after('status_tugas');
        });
    }

    public function down()
    {
        Schema::table('laporan_petugas', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
    }
};