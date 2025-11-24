<?php

namespace App\Http\Controllers;

use App\Models\Petugas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log; 

class PetugasController extends Controller
{
    public function index()
    {
        try {
            $petugas = Petugas::all();
            return response()->json([
                'success' => true,
                'data' => $petugas
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data petugas'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:255',
            'alamat' => 'required|string',
            'nomor_telepon' => 'required|string|max:15',
            'status' => 'required|in:Aktif,Nonaktif'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $petugas = Petugas::create($request->all());
            
            return response()->json([
                'success' => true,
                'message' => 'Petugas berhasil ditambahkan',
                'data' => $petugas
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan petugas'
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:255',
            'alamat' => 'required|string',
            'nomor_telepon' => 'required|string|max:15',
            'status' => 'required|in:Aktif,Nonaktif'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $petugas = Petugas::findOrFail($id);
            $petugas->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Petugas berhasil diupdate',
                'data' => $petugas
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate petugas'
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $petugas = Petugas::findOrFail($id);
            
            // Cek apakah petugas sedang menangani laporan
            if ($petugas->laporans()->whereIn('status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan'])->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menghapus petugas yang sedang menangani laporan'
                ], 422);
            }

            $petugas->delete();

            return response()->json([
                'success' => true,
                'message' => 'Petugas berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus petugas'
            ], 500);
        }
    }

    public function getPetugasAktif()
    {
        try {
            $petugas = Petugas::aktif()->get();
            return response()->json([
                'success' => true,
                'data' => $petugas
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data petugas aktif'
            ], 500);
        }
    }

    // Assign petugas ke laporan
    public function assignToLaporan(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'laporan_id' => 'required|exists:laporans,id',
            'petugas_id' => 'required|exists:petugas,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $petugas = Petugas::findOrFail($request->petugas_id);
            
            // Cek apakah petugas aktif
            if ($petugas->status !== 'Aktif') {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menugaskan petugas yang nonaktif'
                ], 422);
            }

            // Assign petugas ke laporan
            $petugas->laporans()->attach($request->laporan_id, [
                'status_tugas' => 'Dikirim',
                'dikirim_pada' => now()
            ]);

            // Update status laporan menjadi "Dalam Proses"
            $laporan = \App\Models\Laporan::find($request->laporan_id);
            $laporan->update(['status' => 'Dalam Proses']);

            return response()->json([
                'success' => true,
                'message' => 'Petugas berhasil ditugaskan ke laporan'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menugaskan petugas'
            ], 500);
        }
    }

    public function getPetugasByLaporan($laporanId)
    {
        try {
            $petugas = Petugas::whereHas('laporans', function($query) use ($laporanId) {
                $query->where('laporans.id', $laporanId);
            })->get();

            return response()->json([
                'success' => true,
                'data' => $petugas
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching petugas by laporan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data petugas'
            ], 500);
        }
    }
}