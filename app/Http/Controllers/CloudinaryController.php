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
                'access_mode' => 'public',
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

    // Upload PDF/Dokumen → Generate thumbnail + URL download
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

            // Upload sebagai raw (PDF)
            $uploadedFile = Cloudinary::upload($file->getRealPath(), [
                'public_id' => $publicId,
                'folder' => $folder,
                'resource_type' => 'raw',
                'use_filename' => true,
                'unique_filename' => false,
                'overwrite' => false,
                'access_mode' => 'public',
            ]);

            $secureUrl = $uploadedFile->getSecurePath();

            // 🔥 Generate thumbnail preview (halaman 1)
            $thumbnailUrl = Cloudinary::url(
                $uploadedFile->getPublicId(),
                [
                    'resource_type' => 'raw',
                    'format' => 'jpg',
                    'page' => 1,
                    'width' => 400,
                    'height' => 600,
                    'crop' => 'fit',
                    'quality' => 'auto',
                ]
            );

            // 🔥 URL untuk download langsung
            $downloadUrl = str_replace('/upload/', '/upload/fl_attachment/', $secureUrl);

            return response()->json([
                'success' => true,
                'url' => $secureUrl,
                'download_url' => $downloadUrl,
                'preview_url' => $thumbnailUrl, // ✅ untuk preview seperti foto
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

    // 🔥 Upload bukti perbaikan (admin) → PDF + Thumbnail
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
                'rincian_biaya_download_url' => null,
                'rincian_biaya_preview_url' => null, // ✅ tambahkan ini
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
                        'access_mode' => 'public',
                    ]);
                    $uploadedData['foto_bukti_perbaikan'][] = $uploaded->getSecurePath();
                }
            }

            // Upload PDF → PUBLIC + THUMBNAIL
            if ($request->hasFile('rincian_biaya_pdf')) {
                $file = $request->file('rincian_biaya_pdf');
                $uploaded = Cloudinary::upload($file->getRealPath(), [
                    'folder' => 'Home/admin-bukti-perbaikan/rincian-biaya',
                    'public_id' => 'admin-biaya-' . $laporanId . '-' . time(),
                    'resource_type' => 'raw',
                    'use_filename' => true,
                    'unique_filename' => true,
                    'access_mode' => 'public',
                ]);

                $secureUrl = $uploaded->getSecurePath();
                $downloadUrl = str_replace('/upload/', '/upload/fl_attachment/', $secureUrl);

                // 🔥 Generate thumbnail preview
                $previewUrl = Cloudinary::url(
                    $uploaded->getPublicId(),
                    [
                        'resource_type' => 'raw',
                        'format' => 'jpg',
                        'page' => 1,
                        'width' => 400,
                        'height' => 600,
                        'crop' => 'fit',
                        'quality' => 'auto',
                    ]
                );

                $uploadedData['rincian_biaya_pdf'] = $secureUrl;
                $uploadedData['rincian_biaya_download_url'] = $downloadUrl;
                $uploadedData['rincian_biaya_preview_url'] = $previewUrl; // ✅
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