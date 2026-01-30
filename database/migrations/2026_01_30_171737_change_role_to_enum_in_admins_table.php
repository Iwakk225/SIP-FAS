<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Normalisasi: pastikan semua role = 'admin'
        DB::table('admins')->whereNull('role')->update(['role' => 'admin']);
        DB::table('admins')->where('role', '!=', 'admin')->update(['role' => 'admin']);

        // Ubah kolom role jadi ENUM
        Schema::table('admins', function (Blueprint $table) {
            $table->enum('role', ['admin'])->change();
        });
    }

    public function down()
    {
        // Kembalikan ke VARCHAR(255)
        Schema::table('admins', function (Blueprint $table) {
            $table->string('role')->change();
        });
    }
};