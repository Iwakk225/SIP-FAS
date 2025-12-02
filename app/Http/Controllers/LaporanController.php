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

            // Assign petugas menggunakan relasi
            $laporan->petugas()->attach($validated['petugas_id'], [
                'status_tugas' => 'Dikirim',
                'catatan' => $validated['catatan'] ?? null,
                'dikirim_pada' => now()
            ]);

            // Update status laporan
            $laporan->update(['status' => 'Dalam Proses']);

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
                $laporan->update(['status' => 'Selesai']);
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
                    $laporan->update(['status' => 'Selesai']);
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