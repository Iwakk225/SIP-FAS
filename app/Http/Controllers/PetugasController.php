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
            $petugas = Petugas::with(['laporans' => function ($query) {
                $query->where('laporan_petugas.is_active', 1)
                      ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan'])
                      ->select('laporans.id', 'laporans.judul', 'laporans.status');
            }])->get();

            $petugas->each(function ($item) {
                $item->status_penugasan = $item->status_penugasan;
                $item->status_penugasan_color = $item->status_penugasan_color;

                $laporanDitangani = $item->laporanDitangani();
                $item->laporan_ditangani = $laporanDitangani ? [
                    'id' => $laporanDitangani->id,
                    'judul' => $laporanDitangani->judul,
                    'status' => $laporanDitangani->status,
                    'status_tugas' => $laporanDitangani->pivot->status_tugas,
                    'dikirim_pada' => $laporanDitangani->pivot->dikirim_pada,
                ] : null;
            });

            return response()->json(['success' => true, 'data' => $petugas]);
        } catch (\Exception $e) {
            Log::error('Index Petugas Error: '.$e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal mengambil data petugas'], 500);
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
            return response()->json(['success' => false, 'message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        try {
            $petugas = Petugas::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Petugas berhasil ditambahkan',
                'data' => $petugas
            ], 201);
        } catch (\Exception $e) {
            Log::error('Store Petugas Error: '.$e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal menambahkan petugas'], 500);
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
            return response()->json(['success' => false, 'message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
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
            Log::error('Update Petugas Error: '.$e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal mengupdate petugas'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $petugas = Petugas::findOrFail($id);

            if ($petugas->isDalamTugas()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menghapus petugas yang sedang dalam tugas'
                ], 422);
            }

            $petugas->delete();

            return response()->json(['success' => true, 'message' => 'Petugas berhasil dihapus']);
        } catch (\Exception $e) {
            Log::error('Destroy Petugas Error: '.$e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal menghapus petugas'], 500);
        }
    }

    public function getPetugasAktif()
    {
        try {
            return response()->json([
                'success' => true,
                'data' => Petugas::aktif()->get()
            ]);
        } catch (\Exception $e) {
            Log::error('GetPetugasAktif Error: '.$e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal mengambil data petugas aktif'], 500);
        }
    }

    public function assignToLaporan(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'laporan_id' => 'required|exists:laporans,id',
            'petugas_id' => 'required|exists:petugas,id',
            'catatan' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        try {
            $petugas = Petugas::findOrFail($request->petugas_id);
            $laporan = Laporan::findOrFail($request->laporan_id);

            if ($petugas->status !== 'Aktif') {
                return response()->json(['success' => false, 'message' => 'Tidak dapat menugaskan petugas yang nonaktif'], 422);
            }

            // cek apakah petugas sedang menangani tugas aktif
            if ($petugas->isDalamTugas()) {
                return response()->json(['success' => false, 'message' => 'Petugas sedang menangani laporan lain'], 422);
            }

            // cek apakah laporan sudah punya petugas aktif
            if ($laporan->petugas()->where('laporan_petugas.is_active', 1)
                        ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan'])
                        ->exists()) {
                return response()->json(['success' => false, 'message' => 'Laporan sudah ditugaskan ke petugas lain'], 422);
            }

            // Assign petugas
            $petugas->laporans()->attach($request->laporan_id, [
                'status_tugas' => 'Dikirim',
                'is_active' => 1,
                'catatan' => $request->catatan ?? null,
                'dikirim_pada' => now()
            ]);

            // Update status laporan
            $laporan->update(['status' => 'Dalam Proses']);

            return response()->json(['success' => true, 'message' => 'Petugas berhasil ditugaskan ke laporan']);
        } catch (\Exception $e) {
            Log::error("Assign Petugas Error: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal menugaskan petugas'], 500);
        }
    }

    public function releaseFromLaporan(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'laporan_id' => 'required|exists:laporans,id',
            'petugas_id' => 'required|exists:petugas,id',
            'catatan' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        try {
            $laporan = Laporan::findOrFail($request->laporan_id);
            
            Log::info("🔓 Releasing petugas", [
                'laporan_id' => $request->laporan_id,
                'petugas_id' => $request->petugas_id,
                'catatan' => $request->catatan
            ]);

            // 🔥 PERBAIKAN: Pastikan is_active di-set ke 0 agar petugas tersedia lagi
            $laporan->petugas()->updateExistingPivot($request->petugas_id, [
                'status_tugas' => 'Selesai',
                'catatan' => $request->catatan ?? null,
                'is_active' => 0 // 🔥 INI PENTING!
            ]);

            // Cek apakah masih ada petugas aktif untuk laporan ini
            $hasActive = $laporan->petugas()
                ->where('laporan_petugas.is_active', 1)
                ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan'])
                ->exists();

            if (!$hasActive) {
                $laporan->update(['status' => 'Selesai']);
                Log::info("✅ Laporan {$laporan->id} status updated to Selesai");
            }

            Log::info("✅ Petugas berhasil dilepas dan tersedia kembali");
            
            return response()->json([
                'success' => true, 
                'message' => 'Petugas berhasil dilepas dari laporan',
                'data' => [
                    'laporan_status' => $laporan->status,
                    'petugas_tersedia_kembali' => true
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error("❌ Release Error: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal melepas petugas'], 500);
        }
    }

    // app/Http/Controllers/PetugasController.php
    public function getPetugasTersedia(Request $request)
    {
        try {
            $laporanId = $request->laporan_id;
            
            Log::info("🔍 Fetch petugas tersedia", [
                'laporan_id' => $laporanId,
                'method' => 'getPetugasTersedia'
            ]);
            
            // Gunakan scope tersedia dari model
            $query = Petugas::tersedia($laporanId);
            
            // 🔥 PERBAIKAN: Tambahkan log untuk debugging
            $petugas = $query->get();
            
            // Log detail untuk debugging
            Log::info("📊 Hasil query petugas tersedia", [
                'total' => $petugas->count(),
                'petugas' => $petugas->pluck('nama')->toArray(),
                'laporan_id' => $laporanId
            ]);
            
            // Debug: Cek status masing-masing petugas
            foreach ($petugas as $p) {
                $tugasAktif = $p->laporans()
                    ->where('laporan_petugas.is_active', 1)
                    ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan'])
                    ->count();
                    
                $tugasSelesai = $p->laporans()
                    ->where('laporan_petugas.is_active', 1)
                    ->where('laporan_petugas.status_tugas', 'Selesai')
                    ->count();
                    
                Log::debug("Petugas {$p->nama}: Aktif={$tugasAktif}, Selesai={$tugasSelesai}");
            }
            
            return response()->json([
                'success' => true,
                'data' => $petugas,
                'debug' => [
                    'total_petugas' => $petugas->count(),
                    'laporan_id' => $laporanId,
                    'timestamp' => now()->format('Y-m-d H:i:s')
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error("❌ Fetch Tersedia Error: " . $e->getMessage());
            Log::error("Stack trace:", $e->getTrace());
            return response()->json(['success' => false, 'message' => 'Gagal mengambil data petugas tersedia'], 500);
        }
    }

    public function getPetugasDalamTugas()
    {
        try {
            $petugas = Petugas::whereHas('laporans', function ($q) {
                $q->where('laporan_petugas.is_active', 1)
                  ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan']);
            })
                ->with(['laporans' => function ($q) {
                    $q->where('laporan_petugas.is_active', 1)
                      ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan'])
                      ->select('laporans.id', 'laporans.judul', 'laporans.lokasi');
                }])
                ->get();

            return response()->json(['success' => true, 'data' => $petugas]);
        } catch (\Exception $e) {
            Log::error("Fetch DalamTugas Error: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal mengambil data petugas dalam tugas'], 500);
        }
    }

    public function updateStatusTugas(Request $request, $petugasId)
    {
        $validator = Validator::make($request->all(), [
            'laporan_id' => 'required|exists:laporans,id',
            'status_tugas' => 'required|in:Dikirim,Diterima,Dalam Pengerjaan,Selesai',
            'catatan' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        try {
            $laporan = Laporan::findOrFail($request->laporan_id);

            // Update pivot status
            $laporan->updateStatusTugasPetugas($petugasId, $request->status_tugas, $request->catatan);

            // Jika status tugas Selesai, non-aktifkan pivot
            if ($request->status_tugas === 'Selesai') {
                $laporan->petugas()->updateExistingPivot($petugasId, [
                    'status_tugas' => 'Selesai',
                    'catatan' => $request->catatan ?? null,
                    'is_active' => 0
                ]);

                // Cek apakah semua petugas sudah selesai
                $hasActive = $laporan->petugas()
                    ->where('laporan_petugas.is_active', 1)
                    ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan'])
                    ->exists();

                if (!$hasActive) {
                    $laporan->update(['status' => 'Selesai']);
                }
            }

            return response()->json(['success' => true, 'message' => 'Status tugas berhasil diperbarui']);
        } catch (\Exception $e) {
            Log::error("Update Tugas Error: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal memperbarui status tugas'], 500);
        }
    }

    public function getPetugasByLaporan($laporanId)
    {
        try {
            $laporan = Laporan::findOrFail($laporanId);
            $petugas = $laporan->petugas()
                ->withPivot('status_tugas', 'catatan', 'dikirim_pada', 'is_active')
                ->get();

            return response()->json(['success' => true, 'data' => $petugas]);
        } catch (\Exception $e) {
            Log::error("Fetch Petugas by Laporan Error: ".$e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal mengambil data petugas'], 500);
        }
    }

    public function getStatistik()
    {
        try {
            $total = Petugas::count();
            $aktif = Petugas::aktif()->count();
            $dalamTugas = Petugas::whereHas('laporans', function ($q) {
                $q->where('laporan_petugas.is_active', 1)
                  ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan']);
            })->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'aktif' => $aktif,
                    'dalam_tugas' => $dalamTugas,
                    'tersedia' => $aktif - $dalamTugas,
                    'nonaktif' => $total - $aktif
                ]
            ]);
        } catch (\Exception $e) {
            Log::error("Statistik Error: ".$e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal mengambil statistik petugas'], 500);
        }
    }
}