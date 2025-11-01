<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Auth\Events\PasswordReset;
use App\Models\PasswordResetCode;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PasswordResetController extends Controller
{
    public function forgot(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        // Cek apakah user exists
        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            return response()->json(['message' => 'Email tidak ditemukan.'], 400);
        }

        // Generate kode verifikasi
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Hapus kode lama untuk email ini
        PasswordResetCode::where('email', $request->email)->delete();
        
        // Simpan kode baru
        PasswordResetCode::create([
            'email' => $request->email,
            'code' => $code,
            'expires_at' => now()->addMinutes(5)
        ]);

        // Kirim email
        $user->notify(new \App\Notifications\PasswordResetCodeNotification($code));

        return response()->json([
            'message' => 'Kode verifikasi telah dikirim ke email Anda!',
            'expires_in' => 5 // menit
        ]);
    }

    public function verifyCode(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6'
        ]);

        // Cari kode yang valid
        $resetCode = PasswordResetCode::where('email', $request->email)
            ->where('code', $request->code)
            ->where('expires_at', '>', now())
            ->first();

        if (!$resetCode) {
            return response()->json([
                'message' => 'Kode tidak valid atau sudah kadaluarsa.'
            ], 400);
        }

        return response()->json([
            'message' => 'Kode valid!',
            'verified' => true
        ]);
    }

    public function reset(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'password' => 'required|min:6|confirmed',
        ]);

        // Verifikasi kode terlebih dahulu
        $resetCode = PasswordResetCode::where('email', $request->email)
            ->where('code', $request->code)
            ->where('expires_at', '>', now())
            ->first();

        if (!$resetCode) {
            return response()->json([
                'message' => 'Kode tidak valid atau sudah kadaluarsa.'
            ], 400);
        }

        // Reset password
        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan.'], 400);
        }

        $user->forceFill([
            'password' => Hash::make($request->password)
        ])->setRememberToken(Str::random(60));

        $user->save();

        // Hapus kode yang sudah digunakan
        $resetCode->delete();

        // Hapus semua kode untuk email ini
        PasswordResetCode::where('email', $request->email)->delete();

        event(new PasswordReset($user));

        return response()->json(['message' => 'Password berhasil direset!']);
    }

    // Method lama untuk compatibility (jika ada yang masih menggunakan token)
    public function resetWithToken(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:6|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password)
                ])->setRememberToken(Str::random(60));

                $user->save();

                event(new PasswordReset($user));
            }
        );

        return $status === Password::PASSWORD_RESET
            ? response()->json(['message' => 'Password berhasil direset!'])
            : response()->json(['message' => 'Token tidak valid atau sudah kadaluarsa.'], 400);
    }
}