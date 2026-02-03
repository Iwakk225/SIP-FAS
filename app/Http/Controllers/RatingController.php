<?php

namespace App\Http\Controllers;

use App\Models\Rating;
use App\Models\Laporan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Admin;

class RatingController extends Controller
{
    // RatingController.php
    public function store(Request $request, $laporanId)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'User tidak terautentikasi'], 401);
        }

        // Cek status user
        if ($user->status !== 'aktif') {
            return response()->json(['message' => 'Akun Anda dinonaktifkan. Tidak dapat memberikan rating.'], 403);
        }

        $laporan = Laporan::findOrFail($laporanId);

        if ($laporan->status !== 'Selesai') {
            return response()->json(['message' => 'Hanya untuk laporan selesai'], 400);
        }

        $request->validate([
            'rating' => 'required|integer|between:1,5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $rating = Rating::updateOrCreate(
            ['laporan_id' => $laporanId, 'user_id' => Auth::id()],
            ['rating' => $request->rating, 'comment' => $request->comment]
        );

        return response()->json(['message' => 'Rating disimpan!', 'rating' => $rating], 201);
    }

    public function show($laporanId)
    {
        // Cek apakah yang login adalah admin
        $isAdmin = Auth::guard('admin')->check() || (Auth::user() instanceof \App\Models\Admin);

        if ($isAdmin) {
            // Jika admin, ambil rating dari user manapun untuk laporan ini
            $rating = Rating::where('laporan_id', $laporanId)
                            ->with('user:id,name') // Relasi user
                            ->select('id', 'user_id', 'rating', 'comment', 'admin_reply', 'admin_replied_at', 'created_at')
                            ->first();
        } else {
            // Jika user biasa, ambil rating milik mereka sendiri
            $rating = Rating::where('laporan_id', $laporanId)
                            ->where('user_id', Auth::id())
                            ->select('id', 'rating', 'comment', 'admin_reply', 'admin_replied_at', 'created_at')
                            ->first();
        }

        return response()->json(['rating' => $rating]);
    }

    public function reply(Request $request, $laporanId)
    {
        // Ambil user yang sedang login (harus admin)
        $user = $request->user();

        // Pastikan yang login adalah Admin (bukan User biasa)
        if (!$user instanceof \App\Models\Admin) {
            return response()->json(['message' => 'Hanya admin yang bisa membalas'], 403);
        }

        // Cari rating berdasarkan laporan
        $rating = Rating::where('laporan_id', $laporanId)->first();

        if (!$rating) {
            return response()->json(['message' => 'Rating tidak ditemukan untuk laporan ini'], 404);
        }

        // Validasi input
        $request->validate([
            'admin_reply' => 'required|string|max:1000',
        ]);

        // Simpan balasan
        $rating->update([
            'admin_reply' => $request->admin_reply,
            'admin_replied_at' => now(),
        ]);

        return response()->json([
            'message' => 'Balasan admin berhasil disimpan',
            'rating' => $rating->load('user') // load relasi user untuk frontend
        ]);
    }

    public function publicReviews(Request $request)
    {
        $reviews = Rating::with('user:id,name,profile_photo_path')
            ->whereHas('laporan', fn($q) => $q->where('status', 'Selesai'))
            ->select('id', 'user_id', 'rating', 'comment', 'admin_reply', 'admin_replied_at', 'created_at') // ← tambah kolom baru
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json(['reviews' => $reviews]);
    }
}