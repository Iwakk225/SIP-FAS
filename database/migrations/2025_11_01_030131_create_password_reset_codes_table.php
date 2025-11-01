<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('password_reset_codes', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
            $table->string('code');
            $table->timestamp('expires_at');
            $table->timestamp('created_at')->useCurrent(); // Hanya created_at
            // HAPUS updated_at karena tidak diperlukan
        });
    }

    public function down()
    {
        Schema::dropIfExists('password_reset_codes');
    }
};