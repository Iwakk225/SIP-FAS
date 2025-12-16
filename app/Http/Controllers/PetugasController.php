<?php

namespace App\Http\Controllers;

use App\Models\Petugas;
use App\Models\Laporan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PetugasController extends Controller
{
    public function index()
{
    try {
        Log::info('🔄 Fetching all petugas data with accurate status');
        
        // 1. AMBIL SEMUA PETUGAS
        $petugas = Petugas::with(['laporans' => function ($query) {
            // Ambil SEMUA laporan yang terkait (tidak difilter)
            $query->select('laporans.id', 'laporans.judul', 'laporans.status')
                  ->withPivot('status_tugas', 'catatan', 'dikirim_pada', 'is_active');
        }])->get();
        
        Log::info('📊 Total petugas fetched: ' . $petugas->count());
        
        // 2. HITUNG STATUS UNTUK SETIAP PETUGAS
        $petugas->each(function ($item) {
            // DEBUG: Tampilkan data laporans
            $laporansCount = $item->laporans ? $item->laporans->count() : 0;
            Log::info('🔍 Petugas: ' . $item->nama . ' - Laporans count: ' . $laporansCount);
            
            if ($laporansCount > 0) {
                Log::info('📋 Laporans detail:', $item->laporans->map(function($l) {
                    return [
                        'judul' => $l->judul,
                        'status' => $l->status,
                        'pivot' => $l->pivot
                    ];
                })->toArray());
            }
            
            // Cari laporan aktif (is_active=1 dan status tugas aktif)
            $laporanAktif = $item->laporans->first(function ($laporan) {
                $pivot = $laporan->pivot;
                return $pivot && 
                       $pivot->is_active == 1 &&
                       in_array($pivot->status_tugas, ['Dikirim', 'Diterima', 'Dalam Pengerjaan']);
            });
            
            $item->sedang_dalam_tugas = !is_null($laporanAktif);
            $item->status_penugasan = $item->sedang_dalam_tugas ? 'Dalam Tugas' : 'Tersedia';
            $item->status_penugasan_color = $item->sedang_dalam_tugas ? 'warning' : 'success';
            
            if ($item->sedang_dalam_tugas && $laporanAktif) {
                $item->laporan_ditangani = [
                    'id' => $laporanAktif->id,
                    'judul' => $laporanAktif->judul,
                    'status' => $laporanAktif->status,
                    'status_tugas' => $laporanAktif->pivot->status_tugas,
                    'is_active' => $laporanAktif->pivot->is_active,
                    'dikirim_pada' => $laporanAktif->pivot->dikirim_pada,
                ];
            } else {
                $item->laporan_ditangani = null;
            }
        });

        Log::info('📊 Petugas status summary:', [
            'total' => $petugas->count(),
            'dalam_tugas' => $petugas->where('sedang_dalam_tugas', true)->count(),
            'tersedia' => $petugas->where('sedang_dalam_tugas', false)->count()
        ]);

        return response()->json([
            'success' => true, 
            'data' => $petugas,
            'debug' => [
                'total' => $petugas->count(),
                'dalam_tugas' => $petugas->where('sedang_dalam_tugas', true)->count(),
                'tersedia' => $petugas->where('sedang_dalam_tugas', false)->count()
            ]
        ]);
    } catch (\Exception $e) {
        Log::error('Index Petugas Error: '.$e->getMessage());
        return response()->json(['success' => false, 'message' => 'Gagal mengambil data petugas'], 500);
    }
}

// TAMBAHKAN METHOD INI DI PETUGAS CONTROLLER
private function checkAndFixPetugasStatus()
{
    try {
        Log::info('🧹 Checking for inconsistent petugas data...');
        
        // Cari data tidak konsisten: petugas dengan is_active=1 tapi laporan sudah selesai
        $inconsistent = DB::table('laporan_petugas as lp')
            ->join('laporans as l', 'lp.laporan_id', '=', 'l.id')
            ->join('petugas as p', 'lp.petugas_id', '=', 'p.id')
            ->where('lp.is_active', 1)
            ->whereIn('lp.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan'])
            ->whereIn('l.status', ['Selesai', 'Ditolak'])
            ->select('lp.*', 'p.nama as petugas_nama', 'l.judul', 'l.status as laporan_status')
            ->get();
        
        if ($inconsistent->count() > 0) {
            Log::warning('🚨 Found inconsistent data:', $inconsistent->toArray());
            
            foreach ($inconsistent as $data) {
                DB::table('laporan_petugas')
                    ->where('id', $data->id)
                    ->update([
                        'status_tugas' => 'Selesai',
                        'is_active' => 0,
                        'catatan' => 'Auto-fixed by system: Laporan ' . $data->laporan_status,
                        'updated_at' => now()
                    ]);
                
                Log::info('✅ Fixed:', [
                    'petugas' => $data->petugas_nama,
                    'laporan' => $data->judul,
                    'old_status' => $data->laporan_status
                ]);
            }
            
            Log::info('🎉 Fixed ' . $inconsistent->count() . ' inconsistent records');
        } else {
            Log::info('✅ No inconsistent data found');
        }
        
        return $inconsistent->count();
        
    } catch (\Exception $e) {
        Log::error('Check and fix error: ' . $e->getMessage());
        return 0;
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

    // Di PetugasController.php, tambahkan method baru

public function refreshPetugasStatus()
{
    try {
        // Ambil semua petugas
        $petugas = Petugas::all();
        
        $petugas->each(function ($petugas) {
            // Update status penugasan berdasarkan data terbaru
            $petugas->load(['laporans' => function($q) {
                $q->where('laporan_petugas.is_active', 1)
                  ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan']);
            }]);
            
            // Simpan ke log untuk debugging
            Log::info('🔄 Refresh petugas status', [
                'petugas_id' => $petugas->id,
                'nama' => $petugas->nama,
                'laporans_active' => $petugas->laporans->count(),
                'is_dalam_tugas' => $petugas->laporans->count() > 0
            ]);
        });
        
        return response()->json([
            'success' => true,
            'message' => 'Status petugas berhasil di-refresh',
            'total_petugas' => $petugas->count()
        ]);
        
    } catch (\Exception $e) {
        Log::error('Refresh petugas error: ' . $e->getMessage());
        return response()->json(['success' => false, 'message' => 'Gagal refresh status petugas'], 500);
    }
}

// Di PetugasController.php, tambahkan route debug
public function debugPetugas($id)
{
    try {
        $petugas = Petugas::with(['laporans' => function ($query) {
            $query->withPivot('status_tugas', 'is_active', 'catatan', 'dikirim_pada');
        }])->findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $petugas,
            'laporans_count' => $petugas->laporans->count(),
            'laporans_detail' => $petugas->laporans->map(function($l) {
                return [
                    'id' => $l->id,
                    'judul' => $l->judul,
                    'status' => $l->status,
                    'pivot' => $l->pivot
                ];
            })
        ]);
        
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
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

    // Di PetugasController.php - method releaseFromLaporan

public function releaseFromLaporan(Request $request)
{
    try {
        Log::info("🔓 Releasing petugas - START", [
            'request_data' => $request->all(),
            'laporan_id' => $request->laporan_id,
            'petugas_id' => $request->petugas_id,
            'catatan' => $request->catatan
        ]);

        // Validasi request
        $validator = Validator::make($request->all(), [
            'laporan_id' => 'required|exists:laporans,id',
            'petugas_id' => 'required|exists:petugas,id',
            'catatan' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            Log::error('❌ Validation failed:', $validator->errors()->toArray());
            return response()->json([
                'success' => false, 
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $laporan = Laporan::findOrFail($request->laporan_id);
        
        // Cek apakah petugas benar-benar terkait dengan laporan ini
        $isPetugasRelated = $laporan->petugas()
            ->where('petugas.id', $request->petugas_id)
            ->exists();
        
        if (!$isPetugasRelated) {
            Log::warning("⚠️ Petugas tidak terkait dengan laporan ini", [
                'petugas_id' => $request->petugas_id,
                'laporan_id' => $request->laporan_id
            ]);
            
            return response()->json([
                'success' => false, 
                'message' => 'Petugas tidak terkait dengan laporan ini'
            ], 422);
        }

        // Cek apakah petugas aktif di laporan ini
        $isPetugasAktif = $laporan->petugas()
            ->where('petugas.id', $request->petugas_id)
            ->where('laporan_petugas.is_active', 1)
            ->whereIn('laporan_petugas.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan'])
            ->exists();
        
        Log::info("📊 Petugas status check:", [
            'is_petugas_related' => $isPetugasRelated,
            'is_petugas_aktif' => $isPetugasAktif
        ]);

        // 🔥 PERBAIKAN: Update pivot table
        $laporan->petugas()->updateExistingPivot($request->petugas_id, [
            'status_tugas' => 'Selesai',
            'catatan' => $request->catatan ?? 'Dilepas oleh admin',
            'is_active' => 0, // 🔥 INI PENTING!
            'updated_at' => now()
        ]);

        Log::info("✅ Petugas berhasil dilepas dan tersedia kembali", [
            'petugas_id' => $request->petugas_id
        ]);

        return response()->json([
            'success' => true, 
            'message' => 'Petugas berhasil dilepas dari laporan',
            'data' => [
                'laporan_id' => $laporan->id,
                'petugas_id' => $request->petugas_id,
                'released_at' => now()->format('Y-m-d H:i:s')
            ]
        ]);
        
    } catch (\Exception $e) {
        Log::error("❌ Release Error: " . $e->getMessage());
        Log::error("Stack trace:", ['exception' => $e]);
        return response()->json(['success' => false, 'message' => 'Gagal melepas petugas: ' . $e->getMessage()], 500);
    }
}

    // app/Http/Controllers/PetugasController.php
    // app/Http/Controllers/PetugasController.php

public function getPetugasTersedia(Request $request)
{
    try {
        $laporanId = $request->laporan_id;
        
        Log::info("🔍 Fetch petugas tersedia - STRICT CHECK", [
            'laporan_id' => $laporanId
        ]);
        
        // 1. AMBIL SEMUA PETUGAS AKTIF
        $petugas = Petugas::where('status', 'Aktif')->get();
        
        // 2. CHECK KONSISTENSI DATA
        $this->checkAndFixPetugasStatus();
        
        // 3. FILTER YANG BENAR-BENAR TERSEDIA
        $petugasTersedia = $petugas->filter(function ($petugas) use ($laporanId) {
            // Cek apakah petugas sedang menangani laporan LAIN yang belum selesai
            $tugasAktifLain = DB::table('laporan_petugas as lp')
                ->join('laporans as l', 'lp.laporan_id', '=', 'l.id')
                ->where('lp.petugas_id', $petugas->id)
                ->where('lp.is_active', 1)
                ->whereIn('lp.status_tugas', ['Dikirim', 'Diterima', 'Dalam Pengerjaan'])
                ->whereNotIn('l.status', ['Selesai', 'Ditolak'])
                ->when($laporanId, function ($query) use ($laporanId) {
                    // Jika cek untuk laporan tertentu, exclude laporan ini
                    return $query->where('l.id', '!=', $laporanId);
                })
                ->exists();
            
            return !$tugasAktifLain;
        })->values();
        
        Log::info("📊 Hasil strict filter:", [
            'total_petugas' => $petugas->count(),
            'tersedia' => $petugasTersedia->count(),
            'dalam_tugas' => $petugas->count() - $petugasTersedia->count(),
            'tersedia_list' => $petugasTersedia->pluck('nama')->toArray()
        ]);
        
        return response()->json([
            'success' => true,
            'data' => $petugasTersedia,
            'debug' => [
                'total_petugas' => $petugas->count(),
                'tersedia_count' => $petugasTersedia->count()
            ]
        ]);
        
    } catch (\Exception $e) {
        Log::error("❌ Fetch Tersedia Error: " . $e->getMessage());
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

    // Di PetugasController.php tambahkan route untuk manual fix
public function manualFixPetugasStatus()
{
    try {
        Log::info('🔧 Manual fix petugas status requested');
        
        $fixedCount = $this->checkAndFixPetugasStatus();
        
        // Juga fix data di laporan_petugas yang tidak konsisten
        $additionalFixes = DB::table('laporan_petugas as lp')
            ->join('laporans as l', 'lp.laporan_id', '=', 'l.id')
            ->where('lp.is_active', 1)
            ->whereIn('l.status', ['Selesai', 'Ditolak'])
            ->update([
                'lp.is_active' => 0,
                'lp.status_tugas' => 'Selesai',
                'lp.updated_at' => now()
            ]);
        
        Log::info('🔧 Manual fix completed', [
            'auto_fixed' => $fixedCount,
            'additional_fixed' => $additionalFixes
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Manual fix completed',
            'data' => [
                'auto_fixed_records' => $fixedCount,
                'additional_fixed_records' => $additionalFixes
            ]
        ]);
        
    } catch (\Exception $e) {
        Log::error('Manual fix error: ' . $e->getMessage());
        return response()->json(['success' => false, 'message' => 'Manual fix failed'], 500);
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