<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\PasswordResetCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdminAuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $admin = Admin::where('email', $request->email)->first();

        if (!$admin || !Hash::check($request->password, $admin->password)) {
            return response()->json([
                'error' => 'Email atau password salah'
            ], 401);
        }

        // Create token
        $token = $admin->createToken('admin-token')->plainTextToken;

        return response()->json([  // PERBAIKAN: gunakan array []
            'admin' => [           // PERBAIKAN: gunakan array []
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role,
            ],
            'token' => $token
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Berhasil logout'
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'admin' => $request->user()
        ]);
    }

    public function requestResetCode(Request $request)
    {
        $admin = $request->user();

        // Generate kode verifikasi
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Hapus kode lama untuk email ini
        PasswordResetCode::where('email', $admin->email)->where('purpose', 'admin_password_reset')->delete();

        // Simpan kode baru
        PasswordResetCode::create([
            'email' => $admin->email,
            'code' => $code,
            'expires_at' => now()->addMinutes(5),
            'purpose' => 'admin_password_reset'
        ]);

        // Kirim email
        $admin->notify(new \App\Notifications\PasswordResetCodeNotification($code));

        return response()->json([
            'message' => 'Kode verifikasi telah dikirim ke email Anda!',
            'expires_in' => 5 // menit
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6',
            'password' => 'required|min:6|confirmed',
        ]);

        $admin = $request->user();

        // Verifikasi kode
        $resetCode = PasswordResetCode::where('email', $admin->email)
            ->where('code', $request->code)
            ->where('purpose', 'admin_password_reset')
            ->where('expires_at', '>', now())
            ->first();

        if (!$resetCode) {
            return response()->json([
                'message' => 'Kode tidak valid atau sudah kadaluarsa.'
            ], 400);
        }

        // Update password
        $admin->forceFill([
            'password' => Hash::make($request->password)
        ])->setRememberToken(Str::random(60));

        $admin->save();

        // Hapus kode yang sudah digunakan
        $resetCode->delete();

        // Hapus semua kode untuk email ini dengan purpose ini
        PasswordResetCode::where('email', $admin->email)->where('purpose', 'admin_password_reset')->delete();

        return response()->json(['message' => 'Password berhasil diubah!']);
    }
}