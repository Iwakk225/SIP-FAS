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
use App\Http\Controllers\GeocodeController;

// ========== TEST ROUTES ========== 
Route::get('/test-api', function() {
    return response()->json([
        'success' => true,
        'message' => 'API is working',
        'timestamp' => now()->format('Y-m-d H:i:s')
    ]);
});

Route::get('/test-db', function() {
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

// ========== PUBLIC ROUTES ==========
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [PasswordResetController::class, 'forgot']);
Route::post('/verify-reset-code', [PasswordResetController::class, 'verifyCode']);
Route::post('/reset-password', [PasswordResetController::class, 'reset']);
Route::post('/contact', [ContactController::class, 'sendEmail']);
Route::post('/laporan', [LaporanController::class, 'store']);
Route::get('/laporan/{id}', [LaporanController::class, 'show']);
Route::get('/geocode/search', [GeocodeController::class, 'search']);
Route::get('/geocode/reverse', [GeocodeController::class, 'reverse']);
Route::get('/nominatim/search', [GeocodeController::class, 'search']);

// Routes untuk statistik
Route::prefix('statistik')->group(function () {
    Route::get('/', [StatistikController::class, 'getStatistik']);
    Route::get('/waktu-respon', [StatistikController::class, 'getWaktuRespon']);
});

// ========== PROTECTED USER ROUTES ==========
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user/notifications', [LaporanController::class, 'getUserNotifications']);
    Route::post('/user/notifications/{laporan}/read', [LaporanController::class, 'markNotificationAsRead']);
    Route::post('/user/notifications/mark-all-read', [LaporanController::class, 'markAllNotificationsAsRead']);
    Route::get('/laporan-user', [LaporanController::class, 'getLaporanByUser']);
    Route::get('/statistik-user', [LaporanController::class, 'getStatistikUser']);
    Route::get('/laporan/{id}/petugas', [LaporanController::class, 'getPetugasByLaporan']);
});

// ========== ADMIN ROUTES ==========
Route::prefix('admin')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login']);
    
    // **HAPUS 'admin' dari sini:**
    Route::middleware(['auth:sanctum'])->group(function () { // ← Hanya auth:sanctum saja
        Route::post('/logout', [AdminAuthController::class, 'logout']);
        Route::get('/me', [AdminAuthController::class, 'me']);
        
        // Routes untuk manage laporan
        Route::get('/laporan', [LaporanController::class, 'index']);
        Route::put('/laporan/{id}', [LaporanController::class, 'update']);
        Route::put('/laporan/{id}/validate', [LaporanController::class, 'validateLaporan']);
        Route::post('/laporan/{id}/upload-bukti', [LaporanController::class, 'uploadBuktiPerbaikan']);
        Route::post('/laporan/{id}/upload-rincian-biaya', [LaporanController::class, 'uploadRincianBiaya']);
        Route::post('/laporan/{id}/upload-all-bukti', [LaporanController::class, 'uploadAllBukti']);
        
        // Admin petugas routes
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
    });
    
    // **OPTION B: Test route dengan middleware admin**
    Route::middleware(['auth:sanctum', 'admin'])->get('/test-middleware', function() {
        return response()->json([
            'success' => true,
            'message' => 'Admin middleware is working'
        ]);
    });
    
    // **OPTION C: Test route tanpa auth sama sekali (sementara debugging)**
    Route::get('/test-laporan', [LaporanController::class, 'index']);
}); // ← INI TUTUP YANG BENAR