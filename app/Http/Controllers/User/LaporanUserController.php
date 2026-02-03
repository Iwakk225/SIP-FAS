<?php

namespace App\Http\Controllers\User;

use App\Models\Laporan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;

class LaporanUserController extends Controller
{
    /**
     * Menampilkan semua laporan milik pengguna.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }

            $laporans = Laporan::where('pelapor_email', $user->email)
                ->orWhere('pelapor_nama', $user->name)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $laporans,
                'message' => 'Data laporan berhasil diambil'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching user laporan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data laporan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Menyimpan laporan baru dari pengguna.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }

            // Cek status user
            if ($user->status !== 'aktif') {
                return response()->json([
                    'success' => false,
                    'message' => 'Akun Anda dinonaktifkan. Tidak dapat membuat laporan.'
                ], 403);
            }

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
                'status' => 'nullable|string',
                'user_id' => 'nullable|integer|exists:users,id',
            ]);

            // Normalisasi lokasi
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

    /**
     * Menampilkan detail laporan milik pengguna.
     */
    public function show($id): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }

            $laporan = Laporan::find($id);
            if (!$laporan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Laporan tidak ditemukan'
                ], 404);
            }

            // Cek apakah laporan milik user ini
            if ($laporan->pelapor_email !== $user->email && $laporan->pelapor_nama !== $user->name) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses ke laporan ini'
                ], 403);
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

    /**
     * Mendapatkan statistik laporan pengguna.
     */
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

    public function getStatistikUmum(Request $request): JsonResponse
    {
        try {
            $periode = $request->query('periode', '');

            $query = Laporan::query();

                Log::info('🔍 Query params:', $request->all());
        Log::info('🔍 Periode value:', ['periode' => $request->query('periode')]);

            switch ($periode) {
                case 'hari_ini':
                    $query->whereDate('created_at', now()->toDateString());
                    break;
                case 'bulan_ini':
                    $query->whereBetween('created_at', [
                        now()->startOfMonth(),
                        now()->endOfMonth()
                    ]);
                    break;
                case 'tahun_ini':
                    $query->whereYear('created_at', now()->year);
                    break;
                case '1 Minggu':
                    $query->where('created_at', '>=', now()->subWeek());
                    break;
                case '1 Bulan':
                    $query->where('created_at', '>=', now()->subMonth());
                    break;
                case '1 Tahun':
                    $query->where('created_at', '>=', now()->subYear());
                    break;
                // default: tidak filter → semua data
            }

            $total = $query->count();
            $selesai = (clone $query)->where('status', 'Selesai')->count();
            $dalamProses = (clone $query)->where('status', 'Dalam Proses')->count();
            $menunggu = (clone $query)->where('status', 'Validasi')->count();
            $tervalidasi = (clone $query)->where('status', 'Tervalidasi')->count();

            // Hitung wilayah
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
                    'persentase_perubahan' => 0,
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

    /**
     * Mendapatkan notifikasi laporan pengguna.
     */
    public function getUserNotifications(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }

            $laporans = Laporan::where('pelapor_email', $user->email)
                ->orWhere('pelapor_nama', $user->name)
                ->orderBy('updated_at', 'desc')
                ->limit(20)
                ->get();

            $lastViewedKey = 'notifications_last_viewed_' . $user->id;
            $lastViewed = Cache::get($lastViewedKey, now()->subDays(1));

            $formattedNotifications = $laporans->map(function($laporan) use ($lastViewed) {
                $isNew = $laporan->updated_at > $lastViewed;
                return [
                    'id' => $laporan->id,
                    'judul' => $laporan->judul,
                    'status' => $laporan->status,
                    'updated_at' => $laporan->updated_at,
                    'message' => $this->getStatusMessage($laporan->status),
                    'is_new' => $isNew
                ];
            });

            $unreadCount = $formattedNotifications->where('is_new', true)->count();

            return response()->json([
                'success' => true,
                'data' => $formattedNotifications,
                'unread_count' => $unreadCount,
                'debug_info' => [
                    'total_laporans' => $laporans->count(),
                    'user_email' => $user->email,
                    'user_name' => $user->name,
                    'last_viewed' => $lastViewed->format('Y-m-d H:i:s'),
                    'current_time' => now()->format('Y-m-d H:i:s')
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching user notifications: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil notifikasi'
            ], 500);
        }
    }

    /**
     * Menandai notifikasi sebagai dibaca.
     */
    public function markNotificationAsRead(Request $request, $laporanId): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }

            $laporan = Laporan::findOrFail($laporanId);

            if ($laporan->pelapor_email !== $user->email && $laporan->pelapor_nama !== $user->name) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses ke laporan ini'
                ], 403);
            }

            $laporan->touch(); // Update updated_at

            return response()->json([
                'success' => true,
                'message' => 'Notifikasi ditandai sebagai dibaca'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error marking notification as read: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menandai notifikasi'
            ], 500);
        }
    }

    /**
     * Menandai semua notifikasi sebagai dibaca.
     */
    public function markAllNotificationsAsRead(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }

            $lastViewedKey = 'notifications_last_viewed_' . $user->id;
            Cache::put($lastViewedKey, now(), now()->addDays(1));

            return response()->json([
                'success' => true,
                'message' => 'Semua notifikasi ditandai sebagai dibaca',
                'last_viewed' => now()->format('Y-m-d H:i:s')
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error marking all notifications as read: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menandai semua notifikasi'
            ], 500);
        }
    }

    // Fungsi internal (helper)
    private function normalizeLocation($location)
    {
        $location = trim($location);
        if (preg_match('/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/', $location, $matches)) {
            return $matches[1] . ', ' . $matches[2];
        }
        return $location;
    }

    private function getStatusMessage($status)
    {
        $messages = [
            'Validasi' => 'Laporan Anda sedang dalam proses validasi',
            'Tervalidasi' => 'Laporan Anda telah divalidasi',
            'Dalam Proses' => 'Laporan Anda sedang ditangani petugas',
            'Selesai' => 'Laporan Anda telah selesai',
            'Ditolak' => 'Laporan Anda ditolak'
        ];
        return $messages[$status] ?? 'Status laporan diperbarui';
    }
}