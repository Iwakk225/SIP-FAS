<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class CloudinaryController extends Controller
{
    // Upload gambar ke folder admin
    public function uploadImage(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'file' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
                'folder' => 'required|string',
                'laporan_id' => 'nullable|integer'
            ]);

            $file = $request->file('file');
            $folder = $request->folder;
            $laporanId = $request->laporan_id;

            $fileName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $publicId = $folder . '/' . ($laporanId ? "laporan-{$laporanId}-" : '') 
                       . time() . '-' . Str::slug($fileName);

            $uploadedFile = Cloudinary::upload($file->getRealPath(), [
                'public_id' => $publicId,
                'folder' => $folder,
                'resource_type' => 'image',
                'use_filename' => true,
                'unique_filename' => false,
                'overwrite' => false,
                'access_mode' => 'public', // 👈 buat gambar juga public (opsional)
            ]);

            return response()->json([
                'success' => true,
                'url' => $uploadedFile->getSecurePath(),
                'public_id' => $uploadedFile->getPublicId(),
                'folder' => $folder,
                'resource_type' => 'image'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Cloudinary image upload error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal upload gambar: ' . $e->getMessage()
            ], 500);
        }
    }

    // Upload PDF/Dokumen ke folder admin → JADI PUBLIC!
    public function uploadDocument(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'file' => 'required|file|mimes:pdf,doc,docx|max:10240',
                'folder' => 'required|string',
                'laporan_id' => 'nullable|integer'
            ]);

            $file = $request->file('file');
            $folder = $request->folder;
            $laporanId = $request->laporan_id;

            $fileName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $publicId = $folder . '/' . ($laporanId ? "laporan-{$laporanId}-" : '') 
                       . time() . '-' . Str::slug($fileName);

            $uploadedFile = Cloudinary::upload($file->getRealPath(), [
                'public_id' => $publicId,
                'folder' => $folder,
                'resource_type' => 'raw',
                'use_filename' => true,
                'unique_filename' => false,
                'overwrite' => false,
                'access_mode' => 'public', // buat dokumen jadi public
            ]);

            $secureUrl = $uploadedFile->getSecurePath();
            $downloadUrl = $secureUrl; // nggak perlu ?fl_attachment

            return response()->json([
                'success' => true,
                'url' => $secureUrl,
                'download_url' => $downloadUrl,
                'public_id' => $uploadedFile->getPublicId(),
                'folder' => $folder,
                'resource_type' => 'raw',
                'original_filename' => $file->getClientOriginalName()
            ], 200);

        } catch (\Exception $e) {
            Log::error('Cloudinary document upload error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal upload dokumen: ' . $e->getMessage()
            ], 500);
        }
    }

    // 🔥 Upload bukti perbaikan (admin) → PDF JUGA PUBLIC!
    public function uploadBuktiAdmin(Request $request, $laporanId): JsonResponse
    {
        try {
            $request->validate([
                'foto_bukti_perbaikan.*' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
                'rincian_biaya_pdf' => 'nullable|file|mimes:pdf|max:10240'
            ]);

            $uploadedData = [
                'foto_bukti_perbaikan' => [],
                'rincian_biaya_pdf' => null,
                'rincian_biaya_download_url' => null
            ];

            // Upload foto
            if ($request->hasFile('foto_bukti_perbaikan')) {
                foreach ($request->file('foto_bukti_perbaikan') as $file) {
                    $uploaded = Cloudinary::upload($file->getRealPath(), [
                        'folder' => 'Home/admin-bukti-perbaikan/foto-perbaikan',
                        'public_id' => 'Home/admin-laporan-' . $laporanId . '-foto-' . time() . '-' . uniqid(),
                        'resource_type' => 'image',
                        'use_filename' => true,
                        'unique_filename' => true,
                        'access_mode' => 'public', // opsional
                    ]);
                    $uploadedData['foto_bukti_perbaikan'][] = $uploaded->getSecurePath();
                }
            }

            // Upload PDF → PUBLIC!
            if ($request->hasFile('rincian_biaya_pdf')) {
                $file = $request->file('rincian_biaya_pdf');
                $uploaded = Cloudinary::upload($file->getRealPath(), [
                    'folder' => 'Home/admin-bukti-perbaikan/rincian-biaya',
                    'public_id' => 'admin-biaya-' . $laporanId . '-' . time(),
                    'resource_type' => 'raw',
                    'use_filename' => true,
                    'unique_filename' => true,
                    'access_mode' => 'public', // ✅ INI KUNCI NYA!
                ]);

                $secureUrl = $uploaded->getSecurePath();
                $uploadedData['rincian_biaya_pdf'] = $secureUrl;
                $uploadedData['rincian_biaya_download_url'] = $secureUrl; // langsung bisa dipakai
            }

            return response()->json([
                'success' => true,
                'data' => $uploadedData,
                'message' => 'Upload bukti admin berhasil',
                'laporan_id' => $laporanId
            ], 200);

        } catch (\Exception $e) {
            Log::error('Upload bukti admin error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal upload bukti: ' . $e->getMessage()
            ], 500);
        }
    }
}