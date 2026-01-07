<?php

namespace App\Http\Controllers\Admin;

use App\Models\Laporan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use App\Http\Controllers\Controller;

class BuktiPerbaikanController extends Controller
{
    /**
     * Upload bukti perbaikan (foto).
     */
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

    /**
     * Upload rincian biaya (PDF).
     */
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
                    'folder' => 'admin-bukti-perbaikan/rincian-biaya',
                    'resource_type' => 'raw'
                ]);
                $pdfUrl = $uploadedFile->getSecurePath();
            }

            $laporan->update([
                'rincian_biaya_pdf' => $pdfUrl,
                'rincian_biaya_download_url' => $pdfUrl . '?fl_attachment'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Rincian biaya berhasil diupload',
                'data' => [
                    'rincian_biaya_pdf' => $pdfUrl,
                    'rincian_biaya_download_url' => $pdfUrl . '?fl_attachment'
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error uploading rincian biaya: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal upload rincian biaya: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload semua bukti sekaligus (foto + PDF).
     */
    public function uploadAllBukti(Request $request, $id): JsonResponse
    {
        try {
            $laporan = Laporan::findOrFail($id);
            $request->validate([
                'foto_bukti_perbaikan' => 'nullable|array',
                'foto_bukti_perbaikan.*' => 'url',
                'rincian_biaya_pdf' => 'nullable|url',
                'rincian_biaya_download_url' => 'nullable|url',
            ]);

            $updateData = [];

            if ($request->has('foto_bukti_perbaikan') && !empty($request->foto_bukti_perbaikan)) {
                $existingPhotos = $laporan->foto_bukti_perbaikan ?? [];
                if (!is_array($existingPhotos)) $existingPhotos = [];
                $updateData['foto_bukti_perbaikan'] = array_merge($existingPhotos, $request->foto_bukti_perbaikan);
            }

            if ($request->has('rincian_biaya_pdf')) {
                $updateData['rincian_biaya_pdf'] = $request->rincian_biaya_pdf;
            }

            if ($request->has('rincian_biaya_download_url')) {
                $updateData['rincian_biaya_download_url'] = $request->rincian_biaya_download_url;
            }

            if (!empty($updateData) && $laporan->status !== 'Selesai') {
                $oldStatus = $laporan->status;
                $updateData['status'] = 'Selesai';
                $laporan->update($updateData);
                if ($oldStatus !== 'Selesai') {
                    $this->createUserNotification($laporan, $oldStatus, 'Selesai');
                }
            } else if (!empty($updateData)) {
                $laporan->update($updateData);
            }

            $responseData = $laporan->toArray();
            $responseData['rincian_biaya_download_url'] = $request->rincian_biaya_download_url
                ?? ($laporan->rincian_biaya_download_url ?? null)
                ?? ($laporan->rincian_biaya_pdf . '?fl_attachment');

            return response()->json([
                'success' => true,
                'message' => 'Bukti perbaikan berhasil disimpan',
                'data' => $responseData,
                'debug' => [
                    'folder_used' => 'admin-bukti-perbaikan/rincian-biaya',
                    'download_url_generated' => true
                ]
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

    // Fungsi helper untuk notifikasi (copy dari LaporanAdminController)
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