<?php

namespace App\Http\Controllers;

use App\Models\Laporan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LaporanController extends Controller
{
    // Simpan laporan baru dari masyarakat
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'judul' => 'required|string|max:255',
            'lokasi' => 'required|string',
            'deskripsi' => 'required|string',
            'kategori' => 'nullable|string',
            'pelapor_nama' => 'required|string|max:255',
            'pelapor_email' => 'nullable|email',
            'pelapor_telepon' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => $validator->errors()
            ], 400);
        }

        try {
            $laporan = Laporan::create([
                'judul' => $request->judul,
                'lokasi' => $request->lokasi,
                'deskripsi' => $request->deskripsi,
                'kategori' => $request->kategori,
                'pelapor_nama' => $request->pelapor_nama,
                'pelapor_email' => $request->pelapor_email,
                'pelapor_telepon' => $request->pelapor_telepon,
                'status' => 'Validasi'
            ]);

            return response()->json([
                'message' => 'Laporan berhasil dikirim!',
                'data' => $laporan
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Gagal mengirim laporan: ' . $e->getMessage()
            ], 500);
        }
    }

    // Ambil semua laporan untuk admin
    public function index()
    {
        $laporans = Laporan::orderBy('created_at', 'desc')->get();
        
        return response()->json([
            'data' => $laporans
        ]);
    }

    // Ambil detail laporan
    public function show($id)
    {
        $laporan = Laporan::find($id);
        
        if (!$laporan) {
            return response()->json([
                'error' => 'Laporan tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'data' => $laporan
        ]);
    }

    // Update status laporan (untuk admin)
    public function updateStatus(Request $request, $id)
    {
        $laporan = Laporan::find($id);
        
        if (!$laporan) {
            return response()->json([
                'error' => 'Laporan tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:Validasi,Tervalidasi,Dalam Proses,Selesai'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => $validator->errors()
            ], 400);
        }

        $laporan->update([
            'status' => $request->status
        ]);

        return response()->json([
            'message' => 'Status laporan berhasil diupdate',
            'data' => $laporan
        ]);
    }
}