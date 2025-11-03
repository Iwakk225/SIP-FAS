<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    public function sendEmail(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'message' => 'required|string|max:500'
        ]);

        try {
            $data = $request->all();

            Mail::raw(
                "PESAN BARU DARI FORM KONTAK SIP-FAS\n\n" .
                "Nama: {$data['name']}\n" .
                "Email: {$data['email']}\n" .
                "Waktu: " . now()->setTimezone('Asia/Jakarta')->format('d F Y H:i') . "\n\n" .
                "Pesan:\n{$data['message']}\n\n" .
                "--\nEmail otomatis dari SIP-FAS",
                
                function ($message) use ($data) {
                    $message->to('muhammadadityarahmansyah18@gmail.com')
                            ->subject('Pesan Kontak SIP-FAS dari: ' . $data['name'])
                            ->replyTo($data['email']);
                }
            );

            return response()->json([
                'message' => 'Pesan berhasil dikirim! Kami akan merespons secepatnya.'
            ]);

        } catch (\Exception $e) {
            Log::error('Email error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.'
            ], 500);
        }
    }
}