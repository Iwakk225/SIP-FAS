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
    Schema::table('password_reset_codes', function (Blueprint $table) {
        $table->string('purpose')->default('password_reset'); // 'password_reset' atau 'email_change'
        $table->string('new_email')->nullable(); // hanya untuk email_change
    });
}

public function down()
{
    Schema::table('password_reset_codes', function (Blueprint $table) {
        $table->dropColumn(['purpose', 'new_email']);
    });
}
};
