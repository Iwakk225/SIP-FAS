<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('laporans', function (Blueprint $table) {
            $table->text('rincian_biaya_download_url')->nullable()->after('rincian_biaya_pdf');
        });
    }

    public function down()
    {
        Schema::table('laporans', function (Blueprint $table) {
            $table->dropColumn('rincian_biaya_download_url');
        });
    }
};