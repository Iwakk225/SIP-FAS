<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;
use App\Models\Admin;

return new class extends Migration
{
    public function up()
    {
        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role')->default('admin');
            $table->rememberToken();
            $table->timestamps();
        });

        // Langsung buat admin account
        Admin::create([
            'name' => 'Admin SIP-FAS',
            'email' => 'sipfassby@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
        ]);
    }

    public function down()
    {
        Schema::dropIfExists('admins');
    }
};