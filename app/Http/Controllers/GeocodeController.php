<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log; // ✅ TAMBAH INI

class GeocodeController extends Controller
{
    /**
     * Search location using OpenStreetMap Nominatim
     */
    public function search(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:3',
            'viewbox' => 'sometimes|string',
            'bounded' => 'sometimes|integer',
        ]);
        
        $query = $request->input('q');
        $viewbox = $request->input('viewbox', '112.55,-7.18,112.85,-7.37'); // Surabaya bounds
        $bounded = $request->input('bounded', 1);
        
        // Cache key untuk mengurangi request ke OSM
        $cacheKey = 'geocode_' . md5($query . $viewbox . $bounded);
        
        // Cek cache dulu (cache 1 jam)
        $cached = Cache::get($cacheKey);
        if ($cached) {
            return response()->json($cached);
        }
        
        try {
            // Request ke OpenStreetMap Nominatim
            $response = Http::withHeaders([
                'User-Agent' => 'SipFas App/1.0 (sipfassby@gmail.com)',
                'Accept' => 'application/json',
                'Accept-Language' => 'id',
            ])->timeout(10)->get('https://nominatim.openstreetmap.org/search', [
                'q' => $query,
                'format' => 'json',
                'limit' => 5,
                'viewbox' => $viewbox,
                'bounded' => $bounded,
                'addressdetails' => 1,
                'countrycodes' => 'id', // Indonesia saja
            ]);
            
            if ($response->successful()) {
                $data = $response->json();
                
                // Filter hasil untuk Surabaya saja
                $filteredData = array_filter($data, function($item) {
                    // Cek apakah ada kata "Surabaya" di display_name
                    return stripos($item['display_name'] ?? '', 'surabaya') !== false ||
                           stripos($item['display_name'] ?? '', 'jawa timur') !== false;
                });
                
                // Jika tidak ada hasil Surabaya, ambil semua
                if (empty($filteredData) && !empty($data)) {
                    $filteredData = $data;
                }
                
                // Cache hasil
                Cache::put($cacheKey, $filteredData, 3600); // 1 jam
                
                return response()->json($filteredData);
            }
            
            return response()->json(['error' => 'Failed to fetch location'], 500);
            
        } catch (\Exception $e) {
            Log::error('Geocode error: ' . $e->getMessage()); // ✅ PERBAIKAN: Log::error()
            return response()->json([
                'error' => 'Service temporarily unavailable',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Reverse geocoding (coordinates to address)
     */
    public function reverse(Request $request)
    {
        $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
        ]);
        
        $lat = $request->input('lat');
        $lng = $request->input('lng');
        
        $cacheKey = 'reverse_geocode_' . md5($lat . $lng);
        
        // Cek cache
        $cached = Cache::get($cacheKey);
        if ($cached) {
            return response()->json($cached);
        }
        
        try {
            $response = Http::withHeaders([
                'User-Agent' => 'SipFas App/1.0 (sipfassby@gmail.com)',
                'Accept' => 'application/json',
            ])->timeout(10)->get('https://nominatim.openstreetmap.org/reverse', [
                'lat' => $lat,
                'lon' => $lng,
                'format' => 'json',
                'zoom' => 18,
                'addressdetails' => 1,
            ]);
            
            if ($response->successful()) {
                $data = $response->json();
                Cache::put($cacheKey, $data, 3600);
                return response()->json($data);
            }
            
            return response()->json(['error' => 'Failed to reverse geocode'], 500);
            
        } catch (\Exception $e) {
            Log::error('Reverse geocode error: ' . $e->getMessage()); // ✅ PERBAIKAN: Log::error()
            return response()->json([
                'error' => 'Service temporarily unavailable'
            ], 500);
        }
    }
}