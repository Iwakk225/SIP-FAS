<?php

namespace App\Http\Controllers\User;

use App\Models\Laporan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;

class NotificationController extends Controller
{
    /**
     * Mendapatkan notifikasi laporan untuk user yang sedang login.
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
                ->orderBy('updated_at', 'desc')
                ->limit(20)
                ->get();

            $lastViewedKey = 'notifications_last_viewed_' . $user->id;
            $lastViewed = Cache::get($lastViewedKey, now()->subDays(1));

            $formattedNotifications = $laporans->map(function ($laporan) use ($lastViewed) {
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
     * Menandai satu notifikasi (laporan) sebagai dibaca.
     */
    public function markAsRead(Request $request, $laporanId): JsonResponse
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

            // Pastikan laporan milik user
            if ($laporan->pelapor_email !== $user->email && $laporan->pelapor_nama !== $user->name) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses ke laporan ini'
                ], 403);
            }

            // Sentuh `updated_at` agar tidak dianggap new lagi
            $laporan->touch();

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
     * Menandai semua notifikasi sebagai dibaca (via cache).
     */
    public function markAllAsRead(Request $request): JsonResponse
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
            Cache::put($lastViewedKey, now(), now()->addDays(30));

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

    /**
     * Helper: pesan berdasarkan status laporan.
     */
    private function getStatusMessage($status)
    {
        $messages = [
            'Validasi'     => 'Laporan Anda sedang dalam proses validasi',
            'Tervalidasi'  => 'Laporan Anda telah divalidasi',
            'Dalam Proses' => 'Laporan Anda sedang ditangani petugas',
            'Selesai'      => 'Laporan Anda telah selesai',
            'Ditolak'      => 'Laporan Anda ditolak'
        ];
        return $messages[$status] ?? 'Status laporan diperbarui';
    }
}