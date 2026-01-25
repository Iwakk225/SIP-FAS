<?php

namespace App\Http\Controllers;

use App\Models\Rating;
use App\Models\Laporan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RatingController extends Controller
{
    // RatingController.php
    public function store(Request $request, $laporanId)
    {
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
        $rating = Rating::where('laporan_id', $laporanId)
                        ->where('user_id', Auth::id())
                        ->first();

        return response()->json(['rating' => $rating]);
    }

    public function publicReviews(Request $request)
    {
        $reviews = Rating::with('user:id,name,profile_photo_path') 
            ->whereHas('laporan', function ($query) {
                $query->where('status', 'Selesai');
            })
            ->select('user_id', 'rating', 'comment', 'created_at')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json(['reviews' => $reviews]);
    }
}