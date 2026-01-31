<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('petugas', function (Blueprint $table) {
            $table->string('email')->nullable()->after('nomor_telepon');
            $table->unique('email'); // opsional: pastikan email unik
        });
    }

    public function down()
    {
        Schema::table('petugas', function (Blueprint $table) {
            $table->dropColumn('email');
        });
    }
};
