<?php

namespace App\Http\Controllers;

use App\Models\Laporan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Rating;

class StatistikController extends Controller
{
    public function getStatistik(Request $request)
    {
        try {
            // Filter berdasarkan periode jika ada
            $periode = $request->input('periode');
            $query = Laporan::query();

            if ($periode) {
                switch ($periode) {
                    case '1 Minggu':
                        $query->where('created_at', '>=', now()->subWeek());
                        break;
                    case '1 Bulan':
                        $query->where('created_at', '>=', now()->subMonth());
                        break;
                    case '1 Tahun':
                        $query->where('created_at', '>=', now()->subYear());
                        break;
                }
            }

            // Total laporan
            $totalLaporan = $query->count();

            // Laporan per status
            $laporanSelesai = (clone $query)->where('status', 'Selesai')->count();
            $dalamProses = (clone $query)->where('status', 'Dalam Proses')->count();
            $menungguVerifikasi = (clone $query)->where('status', 'Validasi')->count();
            $tervalidasi = (clone $query)->where('status', 'Tervalidasi')->count();

            // Laporan per wilayah - kelompokkan berdasarkan mapping wilayah
            $laporanPerWilayah = $this->getLaporanPerWilayah($query);

            // Hitung persentase perubahan
            $previousPeriodTotal = $this->getPreviousPeriodTotal($periode);
            $persentasePerubahan = $previousPeriodTotal > 0 
                ? (($totalLaporan - $previousPeriodTotal) / $previousPeriodTotal) * 100 
                : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'total_laporan' => $totalLaporan,
                    'laporan_selesai' => $laporanSelesai,
                    'dalam_proses' => $dalamProses,
                    'menunggu_verifikasi' => $menungguVerifikasi,
                    'tervalidasi' => $tervalidasi,
                    'laporan_per_wilayah' => $laporanPerWilayah,
                    'persentase_perubahan' => round($persentasePerubahan, 2)
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data statistik: ' . $e->getMessage()
            ], 500);
        }
    }

   private function getLaporanPerWilayah($query)
{
    // Ambil semua data lokasi
    $allLokasi = $query->select('lokasi')->get();
    
    // Definisikan urutan tetap untuk semua wilayah
    $fixedOrder = [
        'Surabaya Pusat',
        'Surabaya Utara', 
        'Surabaya Timur',
        'Surabaya Selatan',
        'Surabaya Barat',
        'Lokasi Lain'
    ];
    
    // Inisialisasi semua wilayah dengan 0
    $wilayahMapping = [];
    foreach ($fixedOrder as $wilayah) {
        $wilayahMapping[$wilayah] = 0;
    }

    foreach ($allLokasi as $lokasi) {
        $lokasiLower = strtolower(trim($lokasi->lokasi));
        $wilayahTerpilih = $this->detectWilayahSmart($lokasiLower);
        if (isset($wilayahMapping[$wilayahTerpilih])) {
            $wilayahMapping[$wilayahTerpilih]++;
        }
    }

    // Konversi ke format yang diinginkan - TAMPILKAN SEMUA
    $result = [];
    foreach ($fixedOrder as $wilayah) {
        $result[] = [
            'lokasi' => $wilayah,
            'total' => $wilayahMapping[$wilayah] ?? 0
        ];
    }

    return $result;
}

private function detectWilayahSmart($locationText)
{
    // Mapping yang LEBIH LENGKAP berdasarkan kecamatan dan kelurahan di Surabaya
    $wilayahMapping = [
        'Surabaya Pusat' => [
            // Kecamatan Genteng
            'genteng', 'ketabang', 'embong kaliasin', 'tambaksari', 'pacarkeling',
            // Kecamatan Gubeng
            'gubeng', 'airlangga', 'barata jaya', 'kertajaya', 'mojo', 'pucang sewu',
            // Kecamatan Tegalsari
            'tegalsari', 'keputran', 'dr. soetomo', 'kedungdoro',
            // Kecamatan Simolawang
            'simolawang', 'perak timur', 'pegirian', 'tidar',
            // Kecamatan Bubutan
            'bubutan', 'alun-alun contong', 'gundih', 'jepara', 'tembok dukuh'
        ],
        'Surabaya Utara' => [
            // Kecamatan Pabean Cantian
            'pabean cantian', 'kapasan', 'nyamplungan', 'perak barat', 'kemayoran',
            // Kecamatan Krembangan
            'krembangan', 'perak utara', 'morokrembangan', 'krembangan selatan',
            // Kecamatan Semampir
            'semampir', 'dukuh kupang', 'dukuh sutorejo', 'dukuh pakis', 'kandangan',
            // Kecamatan Kenjeran
            'kenjeran', 'bulak', 'kedung cowek', 'sukolilo barat', 'sukolilo timur',
            // Kecamatan Bulak
            'bulak banteng', 'kedung asem', 'komplek kenjeran'
        ],
        'Surabaya Timur' => [
            // Kecamatan Gunung Anyar
            'gunung anyar', 'gunung anyar tambak', 'rungkut tengah', 'rungkut menanggal',
            // Kecamatan Sukolilo
            'sukolilo', 'keputih', 'gebang putih', 'klampis ngasem', 'nginden',
            // Kecamatan Rungkut
            'rungkut', 'kali rungkut', 'rungkut kidul', 'rungkut lor', 'wonoayu',
            // Kecamatan Tenggilis Mejoyo
            'tenggilis mejoyo', 'tenggilis', 'mejoyo', 'panjang jiwo', 'kebonsari',
            // Kecamatan Mulyorejo
            'mulyorejo', 'kalijudan', 'manyar sabrangan', 'kejawan putih tambak'
        ],
        'Surabaya Selatan' => [
            // Kecamatan Wonokromo
            'wonokromo', 'wonokromo', 'jagir', 'ngagel', 'ngagel rejo', 'sawunggaling',
            // Kecamatan Jambangan
            'jambangan', 'karah', 'kebonsari', 'pagesangan', 'pagesangan jaya',
            // Kecamatan Gayungan
            'gayungan', 'darmo', 'darmo satrio', 'gunung sari', 'ketintang',
            // Kecamatan Wiyung
            'wiyung', 'babatan', 'balas klumprik', 'wiyung', 'jatimulyo',
            // Kecamatan Karang Pilang
            'karang pilang', 'kebraon', 'kedurus', 'karang pilang'
        ],
        'Surabaya Barat' => [
            // Kecamatan Tandes
            'tandes', 'banjar sugihan', 'balongsari', 'bangking', 'krembangan selatan',
            // Kecamatan Sukomanunggal
            'sukomanunggal', 'tanjungsari', 'sonokwijenan', 'simo', 'simomulyo',
            // Kecamatan Lakarsantri
            'lakarsantri', 'lakarsantri', 'bangking', 'jeruk', 'lidah kulon',
            // Kecamatan Benowo
            'benowo', 'banjarsari', 'klampis', 'putat gede', 'sememi',
            // Kecamatan Pakal
            'pakal', 'babatan', 'bangking', 'balas klumprik'
        ]
    ];

    // Cari di semua mapping
    foreach ($wilayahMapping as $wilayah => $keywords) {
        foreach ($keywords as $keyword) {
            if (strpos($locationText, $keyword) !== false) {
                return $wilayah;
            }
        }
    }

    // Deteksi berdasarkan pola umum
    return $this->detectByPattern($locationText);
}

private function detectByPattern($locationText)
{
    // Deteksi berdasarkan pola nama jalan/daerah
    $patterns = [
        'Surabaya Pusat' => [
            'pasar atom', 'tunjungan', 'jalan tunjungan', 'jalan basuki rakhmat',
            'jalan pemuda', 'jalan embong malang', 'jalan darmo', 'jalan kupang',
            'kupang jaya', 'kupang krajan', 'petemon', 'peterongan'
        ],
        'Surabaya Utara' => [
            'jalan perak', 'tanjung perak', 'jalan krembangan', 'jalan kapasan',
            'jalan dupak', 'jalan gading', 'kenjeran park', 'pantai kenjeran'
        ],
        'Surabaya Timur' => [
            'jalan rungkut', 'rungkut industri', 'jalan ahmad yani', 'gunung anyar',
            'sukolilo', 'jalan manyar', 'kampus its', 'kampus unair'
        ],
        'Surabaya Selatan' => [
            'jalan wonokromo', 'jalan darmo', 'jalan jemursari', 'jalan ahmad yani',
            'royal plaza', 'city of tomorrow', 'jalan karang menur'
        ],
        'Surabaya Barat' => [
            'jalan lakarsantri', 'jalan benowo', 'jalan pakal', 'tandes',
            'sukomanunggal', 'simomulyo', 'jalan margomulyo'
        ]
    ];

    foreach ($patterns as $wilayah => $patternList) {
        foreach ($patternList as $pattern) {
            if (strpos($locationText, $pattern) !== false) {
                return $wilayah;
            }
        }
    }

    // Deteksi koordinat
    if (preg_match('/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/', $locationText, $matches)) {
        $lat = (float)$matches[1];
        $lng = (float)$matches[2];
        return $this->getWilayahFromCoordinates($lat, $lng);
    }

    // Default: jika mengandung "surabaya" tapi tidak terdeteksi, anggap Pusat
    if (strpos($locationText, 'surabaya') !== false) {
        return 'Surabaya Pusat';
    }

    return 'Lokasi Lain';
}

private function getWilayahFromCoordinates($lat, $lng)
{
    // Batas koordinat Surabaya yang lebih akurat
    if ($lat >= -7.30 && $lat <= -7.20 && $lng >= 112.65 && $lng <= 112.85) {
        // Lebih detail berdasarkan koordinat
        if ($lng >= 112.73 && $lng <= 112.77) return 'Surabaya Pusat';
        if ($lng >= 112.77 && $lng <= 112.85) return 'Surabaya Timur';
        if ($lat >= -7.30 && $lat <= -7.25) return 'Surabaya Selatan';
        if ($lng >= 112.65 && $lng <= 112.73) return 'Surabaya Barat';
        if ($lat >= -7.20 && $lat <= -7.25) return 'Surabaya Utara';
    }
    
    return 'Lokasi Lain';
}

    private function getPreviousPeriodTotal($periode)
    {
        if (!$periode) return 0;

        $query = Laporan::query();

        switch ($periode) {
            case '1 Minggu':
                $query->whereBetween('created_at', [now()->subWeeks(2), now()->subWeek()]);
                break;
            case '1 Bulan':
                $query->whereBetween('created_at', [now()->subMonths(2), now()->subMonth()]);
                break;
            case '1 Tahun':
                $query->whereBetween('created_at', [now()->subYears(2), now()->subYear()]);
                break;
            default:
                return 0;
        }

        return $query->count();
    }

    public function getWaktuRespon()
    {
        try {
            // Hitung waktu respon rata-rata berdasarkan data aktual
            // Untuk MySQL
            $waktuVerifikasi = Laporan::where('status', '!=', 'Validasi')
                ->select(DB::raw('AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_hours'))
                ->first();

            // Untuk SQLite (fallback)
            if (!$waktuVerifikasi || !$waktuVerifikasi->avg_hours) {
                $waktuVerifikasi = Laporan::where('status', '!=', 'Validasi')
                    ->select(DB::raw('AVG((JULIANDAY(updated_at) - JULIANDAY(created_at)) * 24) as avg_hours'))
                    ->first();
            }

            // Konversi ke format yang mudah dibaca
            $avgHours = $waktuVerifikasi->avg_hours ?? 48; // default 2 hari
            
            $waktuRespon = [
                'verifikasi' => $this->formatWaktu($avgHours / 24), // bagi 24 untuk konversi hari
                'perbaikan' => '5 Hari', // bisa disesuaikan dengan logic bisnis
                'selesai' => '12 Hari' // bisa disesuaikan dengan logic bisnis
            ];

            return response()->json([
                'success' => true,
                'data' => $waktuRespon
            ], 200);

        } catch (\Exception $e) {
            // Return default values jika ada error
            return response()->json([
                'success' => true,
                'data' => [
                    'verifikasi' => '1-2 Hari',
                    'perbaikan' => '5 Hari',
                    'selesai' => '12 Hari'
                ]
            ], 200);
        }
    }

    public function getLandingStats()
    {
        try {
            // 1. Laporan Selesai
            $completedReports = Laporan::where('status', 'Selesai')->count();

            // 2. Laporan Aktif (semua status selain "Selesai" dan "Ditolak")
            $activeReports = Laporan::whereNotIn('status', ['Selesai', 'Ditolak'])->count();

            // 3. Rating Rata-rata
            $avgRating = Rating::avg('rating') ?? 0;
            $formattedAvgRating = number_format($avgRating, 1, '.', '');

            // 4. Rata-rata hari penyelesaian
            $avgDays = Laporan::where('status', 'Selesai')
                ->select(DB::raw('AVG(DATEDIFF(updated_at, created_at)) as avg_days'))
                ->first()
                ->avg_days ?? 0;

            $roundedAvgDays = round($avgDays);

            return response()->json([
                'success' => true,
                'data' => [
                    'completed_reports' => (int) $completedReports,
                    'active_reports' => (int) $activeReports,
                    'avg_rating' => $formattedAvgRating,
                    'avg_days_to_complete' => $roundedAvgDays
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil statistik landing: ' . $e->getMessage()
            ], 500);
        }
    }

    private function formatWaktu($hari)
    {
        if ($hari < 1) {
            return 'Kurang dari 1 Hari';
        } elseif ($hari <= 2) {
            return '1-2 Hari';
        } else {
            return round($hari) . ' Hari';
        }
    }
}