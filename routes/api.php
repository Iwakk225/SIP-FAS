<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\StatistikController;
use App\Http\Controllers\PetugasController;

// Public routes - tidak perlu auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [PasswordResetController::class, 'forgot']);
Route::post('/verify-reset-code', [PasswordResetController::class, 'verifyCode']);
Route::post('/reset-password', [PasswordResetController::class, 'reset']);
Route::post('/contact', [ContactController::class, 'sendEmail']);
Route::post('/laporan', [LaporanController::class, 'store']);
Route::get('/laporan/{id}', [LaporanController::class, 'show']);

// Routes untuk statistik (public bisa akses)
Route::prefix('statistik')->group(function () {
    Route::get('/', [StatistikController::class, 'getStatistik']);
    Route::get('/waktu-respon', [StatistikController::class, 'getWaktuRespon']);
});

// Protected routes - butuh auth
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/laporan-user', [LaporanController::class, 'getLaporanByUser']);
    Route::get('/statistik-user', [LaporanController::class, 'getStatistikUser']);
    Route::get('/laporan/{id}/petugas', [LaporanController::class, 'getPetugasByLaporan']);
});

// Admin routes
Route::prefix('admin')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login']);
    
    // Protected admin routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AdminAuthController::class, 'logout']);
        Route::get('/me', [AdminAuthController::class, 'me']);
        
        // Routes untuk manage laporan
        Route::get('/laporan', [LaporanController::class, 'index']);
        Route::put('/laporan/{id}', [LaporanController::class, 'update']);
        Route::put('/laporan/{id}/validate', [LaporanController::class, 'validateLaporan']);
        Route::post('/laporan/{id}/upload-bukti', [LaporanController::class, 'uploadBuktiPerbaikan']);
        Route::post('/laporan/{id}/upload-rincian-biaya', [LaporanController::class, 'uploadRincianBiaya']);
        
        // Admin petugas routes
        Route::get('/petugas', [PetugasController::class, 'index']);
        Route::get('/petugas/aktif', [PetugasController::class, 'getPetugasAktif']);
        Route::post('/petugas', [PetugasController::class, 'store']);
        Route::put('/petugas/{id}', [PetugasController::class, 'update']);
        Route::delete('/petugas/{id}', [PetugasController::class, 'destroy']);
        Route::post('/petugas/assign-laporan', [PetugasController::class, 'assignToLaporan']);
        Route::post('/petugas/release-laporan', [PetugasController::class, 'releaseFromLaporan']);
        Route::get('/petugas/statistik', [PetugasController::class, 'getStatistik']);
        Route::get('/petugas/dalam-tugas', [PetugasController::class, 'getPetugasDalamTugas']);
    });
});