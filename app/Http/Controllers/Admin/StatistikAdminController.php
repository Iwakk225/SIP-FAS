<?php

namespace App\Http\Controllers\Admin;

use App\Models\Laporan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;

class StatistikAdminController extends Controller
{
    /**
     * Mendapatkan statistik umum laporan.
     */
    public function getStatistikUmum(Request $request): JsonResponse
    {
        try {
            $periode = $request->query('periode', '');
            $query = Laporan::query();

            if ($periode === '1 Minggu') {
                $query->where('created_at', '>=', now()->subWeek());
            } elseif ($periode === '1 Bulan') {
                $query->where('created_at', '>=', now()->subMonth());
            } elseif ($periode === '1 Tahun') {
                $query->where('created_at', '>=', now()->subYear());
            }

            $total = $query->count();
            $selesai = $query->clone()->where('status', 'Selesai')->count();
            $dalamProses = $query->clone()->where('status', 'Dalam Proses')->count();
            $menunggu = $query->clone()->where('status', 'Validasi')->count();
            $tervalidasi = $query->clone()->where('status', 'Tervalidasi')->count();

            $persentasePerubahan = 0;
            if ($periode) {
                $startDate = match($periode) {
                    '1 Minggu' => now()->subWeeks(2),
                    '1 Bulan' => now()->subMonths(2),
                    '1 Tahun' => now()->subYears(2),
                    default => null
                };
                if ($startDate) {
                    $periodeSebelumnya = Laporan::whereBetween('created_at', [
                        $startDate,
                        now()->sub($periode)
                    ])->count();
                    if ($periodeSebelumnya > 0) {
                        $persentasePerubahan = round((($total - $periodeSebelumnya) / $periodeSebelumnya) * 100, 1);
                    }
                }
            }

            $wilayahCount = [
                'Surabaya Barat' => 0,
                'Surabaya Timur' => 0,
                'Surabaya Utara' => 0,
                'Surabaya Selatan' => 0,
                'Surabaya Pusat' => 0
            ];

            $allLaporan = $query->get();
            foreach ($allLaporan as $laporan) {
                $lokasi = strtolower(trim($laporan->lokasi));
                if (str_contains($lokasi, 'barat')) {
                    $wilayahCount['Surabaya Barat']++;
                } elseif (str_contains($lokasi, 'timur')) {
                    $wilayahCount['Surabaya Timur']++;
                } elseif (str_contains($lokasi, 'utara')) {
                    $wilayahCount['Surabaya Utara']++;
                } elseif (str_contains($lokasi, 'selatan')) {
                    $wilayahCount['Surabaya Selatan']++;
                } else {
                    $wilayahCount['Surabaya Pusat']++;
                }
            }

            $laporanPerWilayah = [];
            $urutanWilayah = [
                'Surabaya Barat',
                'Surabaya Timur',
                'Surabaya Utara',
                'Surabaya Selatan',
                'Surabaya Pusat'
            ];
            foreach ($urutanWilayah as $wilayah) {
                $laporanPerWilayah[] = [
                    'lokasi' => $wilayah,
                    'total' => $wilayahCount[$wilayah]
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'total_laporan' => $total,
                    'laporan_selesai' => $selesai,
                    'dalam_proses' => $dalamProses,
                    'menunggu_verifikasi' => $menunggu,
                    'tervalidasi' => $tervalidasi,
                    'persentase_perubahan' => $persentasePerubahan,
                    'laporan_per_wilayah' => $laporanPerWilayah
                ],
                'message' => 'Data statistik umum berhasil diambil'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching statistik umum: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data statistik: ' . $e->getMessage()
            ], 500);
        }
    }
}