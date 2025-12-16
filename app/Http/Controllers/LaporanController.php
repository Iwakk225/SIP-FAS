<?php

namespace App\Http\Controllers;

use App\Models\Laporan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache; 
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class LaporanController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $laporans = Laporan::orderBy('created_at', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'data' => $laporans,
                'message' => 'Data laporan berhasil diambil'
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Error fetching laporan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data laporan: ' . $e->getMessage()
            ], 500);
        }
    }

    // Method untuk menyimpan laporan baru DENGAN FOTO
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'judul' => 'required|string|max:255',
                'lokasi' => 'required|string',
                'deskripsi' => 'required|string',
                'pelapor_nama' => 'required|string|max:255',
                'pelapor_email' => 'nullable|email',
                'pelapor_telepon' => 'nullable|string',
                'foto_laporan' => 'required|array',
                'foto_laporan.*' => 'url',
                'kategori' => 'nullable|string',
                'status' => 'nullable|string'
            ]);

            // Normalisasi lokasi sebelum disimpan
            $validated['lokasi'] = $this->normalizeLocation($validated['lokasi']);

            $laporan = Laporan::create($validated);

            return response()->json([
                'success' => true,
                'data' => $laporan,
                'message' => 'Laporan berhasil dikirim!'
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error storing laporan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim laporan: ' . $e->getMessage()
            ], 500);
        }
    }

    // Method untuk menampilkan detail laporan
    public function show($id): JsonResponse
    {
        try {
            $laporan = Laporan::find($id);
            
            if (!$laporan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Laporan tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $laporan
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error showing laporan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data laporan: ' . $e->getMessage()
            ], 500);
        }
    }

    // METHOD YANG DIPERBAIKI: Update laporan (harus match Route::put('/admin/laporan/{id}'))
    // Di LaporanController.php, method update()

    // Di LaporanController.php

public function update(Request $request, $id): JsonResponse
{
    try {
        $laporan = Laporan::findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'required|in:Validasi,Tervalidasi,Dalam Proses,Selesai,Ditolak'
        ]);

        $oldStatus = $laporan->status;
        
        Log::info('🔄 Update Status Laporan - START:', [
            'laporan_id' => $laporan->id,
            'old_status' => $oldStatus,
            'new_status' => $validated['status']
        ]);
        
        // UPDATE STATUS LAPORAN
        $laporan->update($validated);
        
        Log::info('✅ Laporan status updated');

        // 🔥🔥🔥 AUTO-RELEASE PETUGAS JIKA LAPORAN SELESAI/DITOLAK
        if (($validated['status'] === 'Selesai' || $validated['status'] === 'Ditolak') 
            && $oldStatus !== $validated['status']) {
            
            Log::info('🔥 AUTO-RELEASE: Laporan selesai/ditolak, melepas petugas...', [
                'laporan_id' => $laporan->id,
                'status' => $validated['status']
            ]);
            
            // Ambil semua petugas yang aktif di laporan ini
            $petugasAktif = $laporan->petugas()
                ->wherePivot('is_active', 1)
                ->get();
            
            if ($petugasAktif->count() > 0) {
                Log::info('📊 Petugas yang akan dilepas:', [
                    'count' => $petugasAktif->count(),
                    'petugas' => $petugasAktif->pluck('nama')->toArray()
                ]);
                
                // Update SEMUA petugas yang terkait
                foreach ($petugasAktif as $petugas) {
                    $laporan->petugas()->updateExistingPivot($petugas->id, [
                        'status_tugas' => 'Selesai',
                        'is_active' => 0, // 🔥 INI YANG PENTING - buat petugas tersedia lagi
                        'catatan' => 'Auto-released: Laporan ' . $validated['status'],
                        'updated_at' => now()
                    ]);
                    
                    Log::info('✅ Petugas dilepas:', [
                        'petugas_id' => $petugas->id,
                        'nama' => $petugas->nama
                    ]);
                }
                
                Log::info('🎉 Semua petugas berhasil dilepas dan sekarang TERSEDIA');
                
            } else {
                Log::info('ℹ️ Tidak ada petugas aktif untuk dilepas');
            }
            
            // 🔥 NOTIFIKASI KE USER
            $this->createUserNotification($laporan, $oldStatus, $validated['status']);
            
        } else if ($validated['status'] === 'Dalam Proses') {
            // Jika status berubah ke Dalam Proses, buat notifikasi juga
            $this->createUserNotification($laporan, $oldStatus, $validated['status']);
        }

        Log::info('🔄 Update Status Laporan - COMPLETE');

        return response()->json([
            'success' => true,
            'message' => 'Status laporan berhasil diupdate',
            'data' => $laporan,
            'notification_sent' => true,
            'petugas_released' => ($validated['status'] === 'Selesai' || $validated['status'] === 'Ditolak'),
            'debug' => [
                'old_status' => $oldStatus,
                'new_status' => $validated['status']
            ]
        ], 200);

    } catch (\Exception $e) {
        Log::error('❌ Error updating laporan: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Gagal mengupdate status laporan: ' . $e->getMessage()
        ], 500);
    }
}

    // Tambahkan di LaporanController.php, sebelum method update()
    // Di LaporanController.php, perbaiki method createUserNotification
    private function createUserNotification($laporan, $oldStatus, $newStatus)
    {
        try {
            Log::info('🔔 DEBUG - createUserNotification dipanggil:', [
                'laporan_id' => $laporan->id,
                'pelapor_email' => $laporan->pelapor_email,
                'pelapor_nama' => $laporan->pelapor_nama
            ]);

            // Cari user berdasarkan email atau nama di laporan
            $user = \App\Models\User::where('email', $laporan->pelapor_email)
                ->orWhere('name', $laporan->pelapor_nama)
                ->first();

            Log::info('🔔 DEBUG - User ditemukan:', [
                'user_id' => $user ? $user->id : 'null',
                'user_email' => $user ? $user->email : 'null',
                'user_name' => $user ? $user->name : 'null'
            ]);

            if (!$user) {
                Log::warning('🔔 User tidak ditemukan untuk notifikasi laporan: ' . $laporan->id);
                return;
            }

            // Tentukan pesan berdasarkan perubahan status
            $messages = [
                'Validasi' => 'Laporan Anda sedang dalam proses validasi',
                'Tervalidasi' => 'Laporan Anda telah divalidasi dan akan segera ditangani',
                'Dalam Proses' => 'Laporan Anda sedang ditangani oleh petugas',
                'Selesai' => 'Laporan Anda telah selesai ditangani',
                'Ditolak' => 'Laporan Anda ditolak. Silakan periksa detailnya'
            ];

            $title = "Update Status Laporan: " . $laporan->judul;
            $message = isset($messages[$newStatus]) 
                ? $messages[$newStatus] 
                : "Status laporan berubah dari {$oldStatus} menjadi {$newStatus}";

            Log::info('🔔 Notifikasi dibuat:', [
                'title' => $title,
                'message' => $message,
                'user_id' => $user->id
            ]);
            
            // Simpan ke log untuk debugging
            // Untuk sementara, kita simpan notifikasi di session atau cache
            // Bisa juga simpan ke file log
            
            $logData = [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'laporan_id' => $laporan->id,
                'laporan_judul' => $laporan->judul,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'message' => $message,
                'created_at' => now()->toDateTimeString()
            ];
            
            // Simpan ke file log atau cache
            $logPath = storage_path('logs/notifications.log');
            file_put_contents($logPath, json_encode($logData) . PHP_EOL, FILE_APPEND);

            Log::info("🔔 Notifikasi disimpan ke log: {$logPath}");

        } catch (\Exception $e) {
            Log::error('🔔 Error creating user notification: ' . $e->getMessage());
            Log::error('🔔 Stack trace:', $e->getTrace());
        }
    }

    // Di LaporanController.php, tambahkan method baru
    public function getUserNotifications(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            
            Log::info('🔔 DEBUG - getUserNotifications dipanggil:', [
                'user_id' => $user ? $user->id : 'null',
                'user_email' => $user ? $user->email : 'null',
                'user_name' => $user ? $user->name : 'null'
            ]);
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }

            Log::info('🔔 DEBUG - Mencari laporan untuk:', [
                'email' => $user->email,
                'name' => $user->name
            ]);

            // Ambil laporan user berdasarkan email atau nama
            $laporans = Laporan::where('pelapor_email', $user->email)
                ->orWhere('pelapor_nama', $user->name)
                ->orderBy('updated_at', 'desc')
                ->limit(20) // 🔥 TAMBAH LIMIT
                ->get();

            Log::info('🔔 DEBUG - Jumlah laporan ditemukan:', [
                'count' => $laporans->count()
            ]);

            // 🔥 PERBAIKAN: Gunakan cache untuk last viewed
            $lastViewedKey = 'notifications_last_viewed_' . $user->id;
            $lastViewed = Cache::get($lastViewedKey, now()->subDays(1));
            
            $formattedNotifications = $laporans->map(function($laporan) use ($lastViewed) {
                // 🔥 PERBAIKAN: Notifikasi "new" jika updated setelah lastViewed
                $isNew = $laporan->updated_at > $lastViewed;
                
                $notification = [
                    'id' => $laporan->id,
                    'judul' => $laporan->judul,
                    'status' => $laporan->status,
                    'updated_at' => $laporan->updated_at,
                    'message' => $this->getStatusMessage($laporan->status),
                    'is_new' => $isNew
                ];
                
                Log::info('🔔 DEBUG - Notifikasi laporan:', $notification);
                return $notification;
            });

            // 🔥 PERBAIKAN: Hitung unread berdasarkan lastViewed
            $unreadCount = $formattedNotifications->where('is_new', true)->count();

            return response()->json([
                'success' => true,
                'data' => $formattedNotifications,
                'unread_count' => $unreadCount,
                'debug_info' => [
                    'total_laporans' => $laporans->count(),
                    'user_email' => $user->email,
                    'user_name' => $user->name,
                    'last_viewed' => $lastViewed->format('Y-m-d H:i:s'),
                    'current_time' => now()->format('Y-m-d H:i:s')
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('🔔 Error fetching user notifications: ' . $e->getMessage());
            Log::error('🔔 Stack trace:', $e->getTrace());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil notifikasi'
            ], 500);
        }
    }

    // Tambahkan di LaporanController.php
    public function markNotificationAsRead(Request $request, $laporanId): JsonResponse
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }

            $laporan = Laporan::findOrFail($laporanId);
            
            // Cek apakah laporan milik user ini
            $isUserLaporan = $laporan->pelapor_email === $user->email 
                || $laporan->pelapor_nama === $user->name;
                
            if (!$isUserLaporan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses ke laporan ini'
                ], 403);
            }

            // Update timestamp agar tidak dianggap "new" lagi
            $laporan->touch(); // Update updated_at
            
            Log::info('🔔 Notifikasi ditandai dibaca:', [
                'user_id' => $user->id,
                'laporan_id' => $laporan->id,
                'status' => $laporan->status
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Notifikasi ditandai sebagai dibaca'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error marking notification as read: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menandai notifikasi'
            ], 500);
        }
    }

    public function markAllNotificationsAsRead(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }

            // 🔥 PERBAIKAN: Simpan waktu sekarang sebagai last viewed di cache
            $lastViewedKey = 'notifications_last_viewed_' . $user->id;
            Cache::put($lastViewedKey, now(), now()->addDays(1)); // Simpan 1 hari

            Log::info('🔔 Semua notifikasi ditandai dibaca - Cache updated:', [
                'user_id' => $user->id,
                'last_viewed' => now()->format('Y-m-d H:i:s')
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Semua notifikasi ditandai sebagai dibaca',
                'last_viewed' => now()->format('Y-m-d H:i:s')
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error marking all notifications as read: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menandai semua notifikasi'
            ], 500);
        }
    }

    private function getStatusMessage($status)
    {
        $messages = [
            'Validasi' => 'Laporan Anda sedang dalam proses validasi',
            'Tervalidasi' => 'Laporan Anda telah divalidasi',
            'Dalam Proses' => 'Laporan Anda sedang ditangani petugas',
            'Selesai' => 'Laporan Anda telah selesai',
            'Ditolak' => 'Laporan Anda ditolak'
        ];
        
        return $messages[$status] ?? 'Status laporan diperbarui';
    }

    public function updateStatusTugasPetugas(Request $request, $laporanId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'petugas_id' => 'required|exists:petugas,id',
                'status_tugas' => 'required|in:Dikirim,Dalam Proses,Selesai,Ditolak',
                'catatan' => 'nullable|string'
            ]);

            $laporan = Laporan::findOrFail($laporanId);
            
            // Update status tugas petugas di pivot
            $laporan->petugas()->updateExistingPivot($validated['petugas_id'], [
                'status_tugas' => $validated['status_tugas'],
                'catatan' => $validated['catatan'] ?? null,
                // Jika status tugas Selesai/Ditolak, petugas menjadi tersedia
                'is_active' => ($validated['status_tugas'] === 'Selesai' || $validated['status_tugas'] === 'Ditolak') ? 0 : 1
            ]);

            // Jika status tugas petugas Selesai, cek apakah laporan selesai semua
            if ($validated['status_tugas'] === 'Selesai') {
                $petugasAktif = $laporan->petugas()
                    ->wherePivot('is_active', 1)
                    ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Dalam Proses'])
                    ->count();
                
                if ($petugasAktif === 0) {
                    $laporan->update(['status' => 'Selesai']);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Status tugas petugas berhasil diperbarui',
                'data' => $laporan
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error updating tugas status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui status tugas: ' . $e->getMessage()
            ], 500);
        }
    }

    // Method khusus untuk validasi laporan - SESUAI ROUTE
    public function validateLaporan(Request $request, $id): JsonResponse
    {
        try {
            $laporan = Laporan::find($id);
            
            if (!$laporan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Laporan tidak ditemukan'
                ], 404);
            }

            $oldStatus = $laporan->status;
            $laporan->update(['status' => 'Tervalidasi']);
            
            // 🔥 TAMBAH NOTIFIKASI
            $this->createUserNotification($laporan, $oldStatus, 'Tervalidasi');

            return response()->json([
                'success' => true,
                'data' => $laporan,
                'message' => 'Laporan berhasil divalidasi'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error validating laporan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memvalidasi laporan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function assignPetugas(Request $request, $id): JsonResponse
    {
        try {
            $laporan = Laporan::findOrFail($id);
            
            $validated = $request->validate([
                'petugas_id' => 'required|exists:petugas,id',
                'catatan' => 'nullable|string'
            ]);

            // Cek apakah laporan sudah memiliki petugas
            if ($laporan->hasPetugas()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Laporan sudah memiliki petugas yang ditugaskan'
                ], 422);
            }

            $oldStatus = $laporan->status;

            // Assign petugas menggunakan relasi
            $laporan->petugas()->attach($validated['petugas_id'], [
                'status_tugas' => 'Dikirim',
                'catatan' => $validated['catatan'] ?? null,
                'dikirim_pada' => now()
            ]);

            // Update status laporan
            $laporan->update(['status' => 'Dalam Proses']);
            
            // 🔥 TAMBAH NOTIFIKASI
            $this->createUserNotification($laporan, $oldStatus, 'Dalam Proses');

            // Load petugas yang baru ditugaskan
            $laporan->load(['petugas' => function($query) {
                $query->withPivot('status_tugas', 'catatan', 'dikirim_pada');
            }]);

            return response()->json([
                'success' => true,
                'message' => 'Petugas berhasil ditugaskan ke laporan',
                'data' => $laporan
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error assigning petugas to laporan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menugaskan petugas: ' . $e->getMessage()
            ], 500);
        }
    }

    // **BARU: Lepaskan petugas dari laporan**
    public function releasePetugas(Request $request, $id): JsonResponse
    {
        try {
            $laporan = Laporan::findOrFail($id);
            
            $validated = $request->validate([
                'petugas_id' => 'required|exists:petugas,id',
                'catatan' => 'nullable|string'
            ]);

            // Update status tugas menjadi Selesai
            $laporan->petugas()->updateExistingPivot($validated['petugas_id'], [
                'status_tugas' => 'Selesai',
                'catatan' => $validated['catatan'] ?? null
            ]);

            // Jika semua petugas selesai, update status laporan
            $petugasAktif = $laporan->petugasAktif()->count();
            if ($petugasAktif === 0) {
                $oldStatus = $laporan->status;
                $laporan->update(['status' => 'Selesai']);
                // 🔥 TAMBAH NOTIFIKASI
                // $this->createUserNotification($laporan, $oldStatus, 'Selesai');
            }

            return response()->json([
                'success' => true,
                'message' => 'Petugas berhasil dilepas dari laporan',
                'data' => $laporan
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error releasing petugas from laporan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal melepas petugas: ' . $e->getMessage()
            ], 500);
        }
    }

    // 🔥 PERBAIKAN: Method ini duplicate dengan update(), bisa dihapus
    /*
    public function updateStatus(Request $request, $id)
    {
        $laporan = Laporan::findOrFail($id);
        
        // Simpan status lama
        $oldStatus = $laporan->status;
        
        // Update status laporan
        $laporan->status = $request->status;
        $laporan->save();
        
        // Jika status berubah menjadi "Selesai" atau "Ditolak", update status_tugas petugas
        if (($request->status === 'Selesai' || $request->status === 'Ditolak') && $oldStatus !== $request->status) {
            // Update pivot table untuk semua petugas yang menangani laporan ini
            $laporan->petugas()->updateExistingPivot($laporan->petugas->pluck('id'), [
                'status_tugas' => 'Selesai', // atau status sesuai kebutuhan
                'updated_at' => now()
            ]);
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Status laporan berhasil diupdate'
        ]);
    }
    */

    // **BARU: Update status tugas petugas di laporan**
    public function updateStatusTugas(Request $request, $laporanId): JsonResponse
    {
        try {
            $laporan = Laporan::findOrFail($laporanId);
            
            $validated = $request->validate([
                'petugas_id' => 'required|exists:petugas,id',
                'status_tugas' => 'required|in:Dikirim,Diterima,Dalam Pengerjaan,Selesai',
                'catatan' => 'nullable|string'
            ]);

            $laporan->petugas()->updateExistingPivot($validated['petugas_id'], [
                'status_tugas' => $validated['status_tugas'],
                'catatan' => $validated['catatan'] ?? null
            ]);

            // Jika status tugas Selesai, cek apakah semua petugas sudah selesai
            if ($validated['status_tugas'] === 'Selesai') {
                $petugasAktif = $laporan->petugasAktif()->count();
                if ($petugasAktif === 0) {
                    $oldStatus = $laporan->status;
                    $laporan->update(['status' => 'Selesai']);
                    // 🔥 TAMBAH NOTIFIKASI
                    $this->createUserNotification($laporan, $oldStatus, 'Selesai');
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Status tugas berhasil diperbarui',
                'data' => $laporan
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating tugas status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui status tugas: ' . $e->getMessage()
            ], 500);
        }
    }

    // **BARU: Get laporan yang belum ditugaskan**
    public function getLaporanBelumDitugaskan(): JsonResponse
    {
        try {
            $laporans = Laporan::belumDitugaskan()
                ->where('status', 'Tervalidasi')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $laporans,
                'message' => 'Data laporan belum ditugaskan berhasil diambil'
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Error fetching untagged laporan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data laporan belum ditugaskan: ' . $e->getMessage()
            ], 500);
        }
    }

    // **BARU: Get laporan yang sedang ditangani**
    public function getLaporanDitangani(): JsonResponse
    {
        try {
            $laporans = Laporan::ditugaskan()
                ->where('status', 'Dalam Proses')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $laporans,
                'message' => 'Data laporan sedang ditangani berhasil diambil'
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Error fetching handled laporan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data laporan sedang ditangani: ' . $e->getMessage()
            ], 500);
        }
    }

    // Method untuk upload bukti perbaikan
    public function uploadBuktiPerbaikan(Request $request, $id): JsonResponse
    {
        try {
            $laporan = Laporan::findOrFail($id);
            
            $request->validate([
                'foto_bukti_perbaikan' => 'required|array',
                'foto_bukti_perbaikan.*' => 'image|mimes:jpeg,png,jpg,gif|max:5120'
            ]);

            $uploadedUrls = [];
            
            if ($request->hasFile('foto_bukti_perbaikan')) {
                foreach ($request->file('foto_bukti_perbaikan') as $file) {
                    $uploadedFile = Cloudinary::upload(
                        $file->getRealPath(),
                        [
                            'folder' => 'admin-bukti-perbaikan/foto-perbaikan',
                            'use_filename' => true,
                            'unique_filename' => false,
                            'resource_type' => 'image'
                        ]
                    );

                    $uploadedUrls[] = $uploadedFile->getSecurePath();
                }
            }

            $oldStatus = $laporan->status;
            $laporan->update([
                'foto_bukti_perbaikan' => $uploadedUrls,
                'status' => 'Selesai'
            ]);
            
            // 🔥 TAMBAH NOTIFIKASI
            $this->createUserNotification($laporan, $oldStatus, 'Selesai');

            return response()->json([
                'success' => true,
                'message' => 'Bukti perbaikan berhasil diupload',
                'data' => $laporan
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error uploading bukti perbaikan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal upload bukti perbaikan: ' . $e->getMessage()
            ], 500);
        }
    }

    // Method untuk upload rincian biaya PDF
    public function uploadRincianBiaya(Request $request, $id): JsonResponse
    {
        try {
            $laporan = Laporan::findOrFail($id);
            
            $request->validate([
                'rincian_biaya_pdf' => 'required|file|mimes:pdf|max:10240'
            ]);

            $pdfUrl = null;

            if ($request->hasFile('rincian_biaya_pdf')) {
                $file = $request->file('rincian_biaya_pdf');
                
                $uploadedFile = Cloudinary::upload($file->getRealPath(), [
                    'folder' => 'rincian-biaya',
                    'resource_type' => 'raw'
                ]);
                
                $pdfUrl = $uploadedFile->getSecurePath();
            }

            $laporan->update([
                'rincian_biaya_pdf' => $pdfUrl
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Rincian biaya berhasil diupload',
                'data' => $laporan
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error uploading rincian biaya: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal upload rincian biaya: ' . $e->getMessage()
            ], 500);
        }
    }

    // Method untuk upload semua bukti (foto + PDF) sekaligus
    public function uploadAllBukti(Request $request, $id): JsonResponse
{
    try {
        $laporan = Laporan::findOrFail($id);

        $request->validate([
            'foto_bukti_perbaikan' => 'nullable|array',
            'foto_bukti_perbaikan.*' => 'url',
            'rincian_biaya_pdf' => 'nullable|url'
        ]);

        $updateData = [];

        // Gabungkan foto baru dengan yang sudah ada
        if ($request->has('foto_bukti_perbaikan') && !empty($request->foto_bukti_perbaikan)) {
            $existingPhotos = $laporan->foto_bukti_perbaikan ?? [];
            if (!is_array($existingPhotos)) {
                $existingPhotos = [];
            }
            
            $updateData['foto_bukti_perbaikan'] = array_merge(
                $existingPhotos,
                $request->foto_bukti_perbaikan
            );
        }

        // Update PDF jika ada
        if ($request->has('rincian_biaya_pdf')) {
            $updateData['rincian_biaya_pdf'] = $request->rincian_biaya_pdf;
        }

        // Update status jika belum selesai
        if (!empty($updateData) && $laporan->status !== 'Selesai') {
            $oldStatus = $laporan->status;
            $updateData['status'] = 'Selesai';
            
            $laporan->update($updateData);
            
            // Notifikasi user
            if ($oldStatus !== 'Selesai') {
                $this->createUserNotification($laporan, $oldStatus, 'Selesai');
            }
        } else if (!empty($updateData)) {
            $laporan->update($updateData);
        }

        return response()->json([
            'success' => true,
            'message' => 'Bukti perbaikan berhasil disimpan',
            'data' => $laporan
        ], 200);

    } catch (\Throwable $e) {
        Log::error('UPLOAD ALL BUKTI ERROR', [
            'message' => $e->getMessage(),
            'line' => $e->getLine()
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Gagal menyimpan bukti perbaikan: ' . $e->getMessage()
        ], 500);
    }
}


    // Method untuk mendapatkan laporan berdasarkan user
    public function getLaporanByUser(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }

            // Cari laporan berdasarkan email atau nama user
            $laporans = Laporan::where('pelapor_email', $user->email)
                ->orWhere('pelapor_nama', $user->name)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $laporans,
                'message' => 'Data laporan user berhasil diambil'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching user laporan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data laporan user: ' . $e->getMessage()
            ], 500);
        }
    }

    // Method untuk statistik user
    public function getStatistikUser(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }

            // Hitung statistik berdasarkan user yang login
            $statistik = Laporan::where('pelapor_email', $user->email)
                ->orWhere('pelapor_nama', $user->name)
                ->selectRaw('COUNT(*) as total')
                ->selectRaw('SUM(CASE WHEN status = "Selesai" THEN 1 ELSE 0 END) as selesai')
                ->selectRaw('SUM(CASE WHEN status = "Dalam Proses" THEN 1 ELSE 0 END) as dalam_proses')
                ->selectRaw('SUM(CASE WHEN status = "Validasi" THEN 1 ELSE 0 END) as menunggu')
                ->selectRaw('SUM(CASE WHEN status = "Ditolak" THEN 1 ELSE 0 END) as ditolak')
                ->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $statistik->total ?? 0,
                    'selesai' => $statistik->selesai ?? 0,
                    'dalam_proses' => $statistik->dalam_proses ?? 0,
                    'menunggu' => $statistik->menunggu ?? 0,
                    'ditolak' => $statistik->ditolak ?? 0
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching user statistik: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil statistik user: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getPetugasByLaporan($laporanId): JsonResponse
    {
        try {
            $laporan = Laporan::find($laporanId);
            
            if (!$laporan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Laporan tidak ditemukan'
                ], 404);
            }

            // Ambil data petugas yang terkait dengan laporan ini
            $petugas = $laporan->petugas()
                ->withPivot('status_tugas', 'catatan', 'dikirim_pada')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $petugas,
                'message' => 'Data petugas berhasil diambil'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching petugas for laporan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data petugas: ' . $e->getMessage()
            ], 500);
        }
    }

    private function normalizeLocation($location)
    {
        // Bersihkan dan normalisasi teks lokasi
        $location = trim($location);
        
        // Jika koordinat, pastikan format konsisten
        if (preg_match('/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/', $location, $matches)) {
            return $matches[1] . ', ' . $matches[2]; // Format konsisten
        }
        
        return $location;
    }
}