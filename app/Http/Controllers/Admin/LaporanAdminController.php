<?php

namespace App\Http\Controllers\Admin;

use App\Models\Laporan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Http\Controllers\Controller;

class LaporanAdminController extends Controller
{
    /**
     * Menampilkan semua laporan (untuk admin).
     */
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

    /**
     * Memperbarui status laporan.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $laporan = Laporan::findOrFail($id);
            $validated = $request->validate([
                'status' => 'required|in:Validasi,Tervalidasi,Dalam Proses,Selesai,Ditolak',
                'alasan_penolakan' => 'nullable|string|max:500'
            ]);

            $oldStatus = $laporan->status;
            Log::info('🔄 Update Status Laporan - START:', [
                'laporan_id' => $laporan->id,
                'old_status' => $oldStatus,
                'new_status' => $validated['status'],
                'alasan_penolakan' => $validated['alasan_penolakan'] ?? null
            ]);

            if ($validated['status'] === 'Ditolak' && empty($validated['alasan_penolakan'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Harap isi alasan penolakan'
                ], 422);
            }

            if ($validated['status'] !== 'Ditolak') {
                $validated['alasan_penolakan'] = null;
            }

            $laporan->update($validated);
            Log::info('✅ Laporan status updated');

            if (($validated['status'] === 'Selesai' || $validated['status'] === 'Ditolak') && $oldStatus !== $validated['status']) {
                Log::info('🔥 AUTO-RELEASE: Laporan selesai/ditolak, melepas petugas...');
                $laporan->petugas()->updateExistingPivot($laporan->petugas()->pluck('petugas.id'), [
                    'status_tugas' => 'Selesai',
                    'is_active' => 0,
                    'catatan' => 'Auto-released: Laporan ' . $validated['status'],
                    'updated_at' => now()
                ]);
                Log::info('🎉 Semua petugas berhasil dilepas dan sekarang TERSEDIA');
            }

            $this->createUserNotification($laporan, $oldStatus, $validated['status'], $validated['alasan_penolakan'] ?? null);
            Log::info('🔄 Update Status Laporan - COMPLETE');

            return response()->json([
                'success' => true,
                'message' => 'Status laporan berhasil diupdate',
                'data' => $laporan,
                'notification_sent' => true,
                'petugas_released' => ($validated['status'] === 'Selesai' || $validated['status'] === 'Ditolak')
            ], 200);
        } catch (\Exception $e) {
            Log::error('❌ Error updating laporan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate status laporan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Memvalidasi laporan (ubah status ke Tervalidasi).
     */
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

    /**
     * Menugaskan petugas ke laporan.
     */
    public function assignPetugas(Request $request, $id): JsonResponse
    {
        try {
            $laporan = Laporan::findOrFail($id);
            $validated = $request->validate([
                'petugas_id' => 'required|exists:petugas,id',
                'catatan' => 'nullable|string'
            ]);

            if ($laporan->hasPetugas()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Laporan sudah memiliki petugas yang ditugaskan'
                ], 422);
            }

            $oldStatus = $laporan->status;
            $laporan->petugas()->attach($validated['petugas_id'], [
                'status_tugas' => 'Dikirim',
                'catatan' => $validated['catatan'] ?? null,
                'dikirim_pada' => now()
            ]);
            $laporan->update(['status' => 'Dalam Proses']);
            $this->createUserNotification($laporan, $oldStatus, 'Dalam Proses');
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

    /**
     * Melepas petugas dari laporan.
     */
    public function releasePetugas(Request $request, $id): JsonResponse
    {
        try {
            $laporan = Laporan::findOrFail($id);
            $validated = $request->validate([
                'petugas_id' => 'required|exists:petugas,id',
                'catatan' => 'nullable|string'
            ]);

            $laporan->petugas()->updateExistingPivot($validated['petugas_id'], [
                'status_tugas' => 'Selesai',
                'catatan' => $validated['catatan'] ?? null
            ]);

            $petugasAktif = $laporan->petugasAktif()->count();
            if ($petugasAktif === 0) {
                $oldStatus = $laporan->status;
                $laporan->update(['status' => 'Selesai']);
                // $this->createUserNotification($laporan, $oldStatus, 'Selesai'); // Opsional, bisa diaktifkan jika perlu
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

    /**
     * Mengupdate status tugas petugas.
     */
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

            if ($validated['status_tugas'] === 'Selesai') {
                $petugasAktif = $laporan->petugasAktif()->count();
                if ($petugasAktif === 0) {
                    $oldStatus = $laporan->status;
                    $laporan->update(['status' => 'Selesai']);
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

    /**
     * Mendapatkan laporan yang belum ditugaskan.
     */
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

    /**
     * Mendapatkan laporan yang sedang ditangani.
     */
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

    /**
     * Mendapatkan daftar petugas untuk sebuah laporan.
     */
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

            if ($laporan->status === 'Selesai') {
                $petugas = $laporan->petugas()
                    ->withPivot('status_tugas', 'catatan', 'dikirim_pada', 'is_active')
                    ->orderBy('laporan_petugas.dikirim_pada', 'desc')
                    ->get();
            } else {
                $petugas = $laporan->petugas()
                    ->wherePivot('is_active', 1)
                    ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan'])
                    ->withPivot('status_tugas', 'catatan', 'dikirim_pada')
                    ->orderBy('laporan_petugas.dikirim_pada', 'desc')
                    ->get();
            }

            return response()->json([
                'success' => true,
                'data' => $petugas,
                'message' => 'Data petugas berhasil diambil',
                'status_laporan' => $laporan->status
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching petugas for laporan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data petugas: ' . $e->getMessage()
            ], 500);
        }
    }

    // Fungsi helper untuk notifikasi (bisa dipindahkan ke service nanti)
    private function createUserNotification($laporan, $oldStatus, $newStatus, $alasanPenolakan = null)
    {
        try {
            Log::info('🔔 DEBUG - createUserNotification dipanggil:', [
                'laporan_id' => $laporan->id,
                'pelapor_email' => $laporan->pelapor_email,
                'pelapor_nama' => $laporan->pelapor_nama,
                'alasan_penolakan' => $alasanPenolakan
            ]);

            $user = \App\Models\User::where('email', $laporan->pelapor_email)
                ->orWhere('name', $laporan->pelapor_nama)
                ->first();

            if (!$user) {
                Log::warning('🔔 User tidak ditemukan untuk notifikasi laporan: ' . $laporan->id);
                return;
            }

            $messages = [
                'Validasi' => 'Laporan Anda sedang dalam proses validasi',
                'Tervalidasi' => 'Laporan Anda telah divalidasi dan akan segera ditangani',
                'Dalam Proses' => 'Laporan Anda sedang ditangani oleh petugas',
                'Selesai' => 'Laporan Anda telah selesai ditangani. Terima kasih atas laporannya!',
                'Ditolak' => $alasanPenolakan
                    ? "Laporan Anda ditolak. Alasan: {$alasanPenolakan}"
                    : "Laporan Anda ditolak. Silakan periksa detailnya."
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

            $logData = [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'laporan_id' => $laporan->id,
                'laporan_judul' => $laporan->judul,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'alasan_penolakan' => $alasanPenolakan,
                'message' => $message,
                'created_at' => now()->toDateTimeString()
            ];
            $logPath = storage_path('logs/notifications.log');
            file_put_contents($logPath, json_encode($logData) . PHP_EOL, FILE_APPEND);
            Log::info("🔔 Notifikasi disimpan ke log: {$logPath}");
        } catch (\Exception $e) {
            Log::error('🔔 Error creating user notification: ' . $e->getMessage());
            Log::error('🔔 Stack trace:', $e->getTrace());
        }
    }
}