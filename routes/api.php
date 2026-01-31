<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\StatistikController;
use App\Http\Controllers\PetugasController;
use App\Http\Controllers\GeocodeController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\CloudinaryController;
use App\Http\Controllers\User\LaporanUserController;
use App\Http\Controllers\User\NotificationController;
use App\Http\Controllers\Admin\LaporanAdminController;
use App\Http\Controllers\Admin\BuktiPerbaikanController;
use App\Http\Controllers\Admin\StatistikAdminController;
use App\Http\Controllers\RatingController;

// ========== TEST ROUTES ==========
Route::get('/test-api', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is working',
        'timestamp' => now()->format('Y-m-d H:i:s')
    ]);
});

Route::get('/test-db', function () {
    try {
        $count = \App\Models\Laporan::count();
        return response()->json([
            'success' => true,
            'message' => 'Database connected',
            'laporan_count' => $count
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage(),
            'error' => [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]
        ], 500);
    }
});

// ========== CLOUDINARY ROUTES ==========
Route::prefix('cloudinary')->group(function () {
    Route::post('/upload-image', [CloudinaryController::class, 'uploadImage']);
    Route::post('/upload-document', [CloudinaryController::class, 'uploadDocument']);
    Route::post('/upload-bukti-admin/{laporanId}', [CloudinaryController::class, 'uploadBuktiAdmin']);
    Route::post('/generate-download-url', [CloudinaryController::class, 'generateDownloadUrl']);
    Route::post('/list-files', [CloudinaryController::class, 'listFiles']);
    Route::post('/delete-file', [CloudinaryController::class, 'deleteFile']);
});

// ========== PUBLIC ROUTES ==========
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [PasswordResetController::class, 'forgot']);
Route::post('/verify-reset-code', [PasswordResetController::class, 'verifyCode']);
Route::post('/reset-password', [PasswordResetController::class, 'reset']);
Route::post('/contact', [ContactController::class, 'sendEmail']);
Route::post('/laporan', [LaporanUserController::class, 'store']);
Route::get('/laporan/{id}', [LaporanUserController::class, 'show']);
Route::get('/geocode/search', [GeocodeController::class, 'search']);
Route::get('/geocode/reverse', [GeocodeController::class, 'reverse']);
Route::get('/nominatim/search', [GeocodeController::class, 'search']);
Route::get('/stats/landing', [StatistikController::class, 'getLandingStats']);
Route::get('/public-reviews', [RatingController::class, 'publicReviews']);

// ========== STATISTIK ROUTES ==========
Route::prefix('statistik')->group(function () {
    Route::get('/waktu-respon', [StatistikController::class, 'getWaktuRespon']);
    Route::get('/', [StatistikAdminController::class, 'getStatistikUmum']);
});

// ========== PROTECTED USER ROUTES ==========
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user/notifications', [NotificationController::class, 'index']);
    Route::post('/user/notifications/{laporanId}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/user/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::post('/profile/request-email-change', [AuthController::class, 'requestEmailChange']);
    Route::post('/profile/verify-email-change', [AuthController::class, 'verifyEmailChange']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile/photo', [AuthController::class, 'updateProfilePhoto']);
    Route::get('/laporan-user', [LaporanUserController::class, 'index']);
    Route::post('/laporan/{laporanId}/rating', [LaporanUserController::class, 'submitRating']);
    Route::get('/statistik-user', [LaporanUserController::class, 'getStatistikUser']);
    Route::get('/laporan/{id}/petugas', [LaporanAdminController::class, 'getPetugasByLaporan']);
    Route::get('/laporan/{laporanId}/rating', [RatingController::class, 'show']);
    Route::post('/laporan/{laporanId}/rating', [RatingController::class, 'store']);
});

// ========== ADMIN ROUTES ==========
Route::prefix('admin')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login']);
    
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('/logout', [AdminAuthController::class, 'logout']);
        Route::get('/me', [AdminAuthController::class, 'me']);
        Route::get('/laporan', [LaporanAdminController::class, 'index']);
        Route::put('/laporan/{id}', [LaporanAdminController::class, 'update']);
        Route::put('/laporan/{id}/validate', [LaporanAdminController::class, 'validateLaporan']);
        Route::post('/laporan/{id}/upload-all-bukti', [BuktiPerbaikanController::class, 'uploadAllBukti']);
        Route::post('/laporan/{id}/upload-bukti', [BuktiPerbaikanController::class, 'uploadBuktiPerbaikan']);
        Route::post('/laporan/{id}/upload-rincian-biaya', [BuktiPerbaikanController::class, 'uploadRincianBiaya']);
        Route::post('/laporan/{id}/assign-petugas', [LaporanAdminController::class, 'assignPetugas']);
        Route::post('/laporan/{id}/release-petugas', [LaporanAdminController::class, 'releasePetugas']);
        Route::put('/laporan/{id}/update-tugas', [LaporanAdminController::class, 'updateStatusTugas']);
        Route::get('/laporan/belum-ditugaskan', [LaporanAdminController::class, 'getLaporanBelumDitugaskan']);
        Route::get('/laporan/ditangani', [LaporanAdminController::class, 'getLaporanDitangani']);
        Route::get('/laporan/{id}/petugas', [LaporanAdminController::class, 'getPetugasByLaporan']);
        Route::post('/ratings/{laporanId}/reply', [RatingController::class, 'reply']);
        
        // User Management
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::put('/users/{id}/status', [UserController::class, 'updateStatus']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        Route::put('/users/{id}/verify-email', [UserController::class, 'verifyEmail']);
        Route::put('/users/{id}/unverify-email', [UserController::class, 'unverifyEmail']);
        
        // Petugas Management
        Route::get('/petugas', [PetugasController::class, 'index']);
        Route::get('/petugas/aktif', [PetugasController::class, 'getPetugasAktif']);
        Route::get('/petugas/tersedia', [PetugasController::class, 'getPetugasTersedia']);
        Route::post('/petugas', [PetugasController::class, 'store']);
        Route::put('/petugas/{id}', [PetugasController::class, 'update']);
        Route::delete('/petugas/{id}', [PetugasController::class, 'destroy']);
        Route::post('/petugas/assign-laporan', [PetugasController::class, 'assignToLaporan']);
        Route::post('/petugas/release-laporan', [PetugasController::class, 'releaseFromLaporan']);
        Route::get('/petugas/statistik', [PetugasController::class, 'getStatistik']);
        Route::get('/petugas/dalam-tugas', [PetugasController::class, 'getPetugasDalamTugas']);
        Route::post('/petugas/refresh-status', [PetugasController::class, 'refreshPetugasStatus']);
        Route::post('/petugas/manual-fix', [PetugasController::class, 'manualFixPetugasStatus']);
        Route::get('/petugas/debug/{id}', [PetugasController::class, 'debugPetugas']);
        Route::get('/petugas/by-laporan/{laporanId}', [PetugasController::class, 'getPetugasByLaporan']);
    });
    
    Route::middleware(['auth:sanctum', 'admin'])->get('/test-middleware', function () {
        return response()->json([
            'success' => true,
            'message' => 'Admin middleware is working'
        ]);
    });
});