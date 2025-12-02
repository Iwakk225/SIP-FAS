<?php

namespace App\Http\Controllers;

use App\Models\Petugas;
use App\Models\Laporan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log; 

class PetugasController extends Controller
{
    public function index()
    {
        try {
            $petugas = Petugas::with(['laporans' => function($query) {
                $query->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan'])
                      ->select('laporans.id', 'laporans.judul', 'laporans.status');
            }])->get();
            
            // Tambahkan atribut virtual status_penugasan ke response
            $petugas->each(function ($item) {
                $item->status_penugasan = $item->status_penugasan;
                $item->status_penugasan_color = $item->status_penugasan_color;
                
                // Tambahkan data laporan yang sedang ditangani
                $laporanDitangani = $item->laporanDitangani();
                $item->laporan_ditangani = $laporanDitangani ? [
                    'id' => $laporanDitangani->id,
                    'judul' => $laporanDitangani->judul,
                    'status' => $laporanDitangani->status,
                    'status_tugas' => $laporanDitangani->pivot->status_tugas,
                    'dikirim_pada' => $laporanDitangani->pivot->dikirim_pada
                ] : null;
            });
            
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
            if ($petugas->isDalamTugas()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menghapus petugas yang sedang dalam tugas'
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

    // **UPDATE: Assign petugas ke laporan - Versi yang lebih lengkap**
    public function assignToLaporan(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'laporan_id' => 'required|exists:laporans,id',
            'petugas_id' => 'required|exists:petugas,id',
            'catatan' => 'nullable|string'
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
            $laporan = Laporan::findOrFail($request->laporan_id);
            
            // Cek apakah petugas aktif
            if ($petugas->status !== 'Aktif') {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menugaskan petugas yang nonaktif'
                ], 422);
            }

            // Cek apakah petugas sedang dalam tugas lain
            if ($petugas->isDalamTugas()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Petugas sedang menangani laporan lain'
                ], 422);
            }

            // Cek apakah laporan sudah memiliki petugas
            if ($laporan->hasPetugas()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Laporan sudah ditugaskan ke petugas lain'
                ], 422);
            }

            // Assign petugas ke laporan
            $petugas->laporans()->attach($request->laporan_id, [
                'status_tugas' => 'Dikirim',
                'catatan' => $request->catatan,
                'dikirim_pada' => now()
            ]);

            // Update status laporan menjadi "Dalam Proses"
            $laporan->update(['status' => 'Dalam Proses']);

            return response()->json([
                'success' => true,
                'message' => 'Petugas berhasil ditugaskan ke laporan',
                'data' => [
                    'petugas' => $petugas,
                    'laporan' => $laporan,
                    'status_tugas' => 'Dikirim'
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error assigning petugas to laporan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menugaskan petugas: ' . $e->getMessage()
            ], 500);
        }
    }

    // **BARU: Lepaskan petugas dari laporan**
    public function releaseFromLaporan(Request $request)
{
    $validator = Validator::make($request->all(), [
        'laporan_id' => 'required|exists:laporans,id',
        'petugas_id' => 'required|exists:petugas,id',
        'catatan' => 'nullable|string'
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
        $laporan = Laporan::findOrFail($request->laporan_id);
        
        // Update status tugas menjadi Selesai
        $laporan->petugas()->updateExistingPivot($request->petugas_id, [
            'status_tugas' => 'Selesai',
            'catatan' => $request->catatan
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Petugas berhasil dilepas dari laporan'
        ]);
    } catch (\Exception $e) {
        Log::error('Error releasing petugas from laporan: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Gagal melepas petugas'
        ], 500);
    }
}

    // **BARU: Get petugas yang tersedia (tidak sedang dalam tugas)**
    public function getPetugasTersedia()
    {
        try {
            $petugas = Petugas::tersedia()->get();
            
            return response()->json([
                'success' => true,
                'data' => $petugas
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching available petugas: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data petugas tersedia'
            ], 500);
        }
    }

    // **BARU: Get petugas yang sedang dalam tugas**
    public function getPetugasDalamTugas()
    {
        try {
            $petugas = Petugas::dalamTugas()
                ->with(['laporans' => function($query) {
                    $query->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan'])
                          ->select('laporans.id', 'laporans.judul', 'laporans.lokasi');
                }])
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $petugas
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching petugas in duty: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data petugas dalam tugas'
            ], 500);
        }
    }

    // **BARU: Update status tugas petugas di laporan tertentu**
    public function updateStatusTugas(Request $request, $petugasId)
    {
        $validator = Validator::make($request->all(), [
            'laporan_id' => 'required|exists:laporans,id',
            'status_tugas' => 'required|in:Dikirim,Diterima,Dalam Pengerjaan,Selesai',
            'catatan' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $petugas = Petugas::findOrFail($petugasId);
            $laporan = Laporan::findOrFail($request->laporan_id);
            
            // Update status tugas
            $laporan->updateStatusTugasPetugas($petugasId, $request->status_tugas, $request->catatan);
            
            // Jika status tugas Selesai, update status laporan menjadi Selesai
            if ($request->status_tugas === 'Selesai') {
                $laporan->update(['status' => 'Selesai']);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Status tugas berhasil diperbarui',
                'data' => [
                    'petugas' => $petugas,
                    'laporan' => $laporan,
                    'status_tugas' => $request->status_tugas
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating tugas status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui status tugas'
            ], 500);
        }
    }

    public function getPetugasByLaporan($laporanId)
    {
        try {
            $laporan = Laporan::findOrFail($laporanId);
            $petugas = $laporan->petugas()
                ->withPivot('status_tugas', 'catatan', 'dikirim_pada')
                ->get();
                
            $petugas->each(function ($item) {
                $item->status_penugasan = $item->status_penugasan;
            });

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

    // **BARU: Get statistik petugas**
    public function getStatistik()
{
    try {
        $total = Petugas::count();
        $aktif = Petugas::aktif()->count();
        
        // Hitung petugas dalam tugas
        $dalamTugas = Petugas::whereHas('laporans', function($query) {
            $query->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan']);
        })->where('status', 'Aktif')->count();
        
        $tersedia = $aktif - $dalamTugas;
        $nonaktif = $total - $aktif;

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'aktif' => $aktif,
                'dalam_tugas' => $dalamTugas,
                'tersedia' => $tersedia,
                'nonaktif' => $nonaktif
            ]
        ]);
    } catch (\Exception $e) {
        Log::error('Error fetching petugas statistics: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Gagal mengambil statistik petugas'
        ], 500);
    }
}

    
}