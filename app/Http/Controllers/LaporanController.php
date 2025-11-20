<?php

namespace App\Http\Controllers;

use App\Models\Laporan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
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
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $laporan = Laporan::findOrFail($id);
            
            $validated = $request->validate([
                'status' => 'required|in:Validasi,Tervalidasi,Dalam Proses,Selesai,Ditolak'
            ]);

            $laporan->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Status laporan berhasil diupdate',
                'data' => $laporan
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating laporan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate status laporan: ' . $e->getMessage()
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

            $laporan->update(['status' => 'Tervalidasi']);

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
                    $uploadedFile = Cloudinary::upload($file->getRealPath(), [
                        'folder' => 'bukti-perbaikan',
                        'transformation' => [
                            'quality' => 'auto',
                            'fetch_format' => 'auto'
                        ]
                    ]);
                    
                    $uploadedUrls[] = $uploadedFile->getSecurePath();
                }
            }

            $laporan->update([
                'foto_bukti_perbaikan' => $uploadedUrls,
                'status' => 'Selesai'
            ]);

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