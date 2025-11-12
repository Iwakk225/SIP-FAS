<?php

namespace App\Http\Controllers;

use App\Models\Laporan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class LaporanController extends Controller
{
    // Method untuk mendapatkan semua laporan (untuk admin)
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

    // Method untuk menyimpan laporan baru
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'judul' => 'required|string|max:255',
                'lokasi' => 'required|string',
                'deskripsi' => 'required|string',
                'pelapor_nama' => 'required|string|max:255',
                'pelapor_email' => 'nullable|email',
                'pelapor_telepon' => 'nullable|string'
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

    // Method untuk update status laporan
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $laporan = Laporan::find($id);
            
            if (!$laporan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Laporan tidak ditemukan'
                ], 404);
            }

            $validated = $request->validate([
                'status' => 'required|string|in:Validasi,Tervalidasi,Dalam Proses,Selesai'
            ]);

            $laporan->update($validated);

            return response()->json([
                'success' => true,
                'data' => $laporan,
                'message' => 'Status laporan berhasil diupdate'
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
                'message' => 'Gagal update laporan: ' . $e->getMessage()
            ], 500);
        }
    }

    // Method khusus untuk validasi laporan
    public function validateLaporan($id): JsonResponse
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