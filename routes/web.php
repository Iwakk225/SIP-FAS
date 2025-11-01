<?php

use Illuminate\Support\Facades\Route;

// Route untuk reset password - HARUS DITARUH SEBELUM CATCH-ALL
Route::get('/reset-password', function () {
    return view('auth.reset-password');
})->name('password.reset');

// Route untuk forgot password page
Route::get('/forgot-password', function () {
    return view('auth.forgot-password');
})->name('password.request');

// Route catch-all untuk React (HARUS DITARUH PALING BAWAH)
Route::get('/{any?}', function () {
    return view('welcome');
})->where('any', '.*');