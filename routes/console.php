<?php

use Illuminate\Support\Facades\Route;

// Route untuk reset password page - HARUS SESUAI DENGAN URL DI EMAIL
Route::get('/reset-password', function () {
    return view('auth.reset-password');
})->name('password.reset');

// Route catch-all untuk React (jika ada)
Route::get('/{any?}', function () {
    return view('welcome'); 
})->where('any', '.*');