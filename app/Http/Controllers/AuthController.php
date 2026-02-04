<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use App\Models\PasswordResetCode;
use App\Notifications\PasswordResetCodeNotification;
use App\Models\User;

class AuthController extends Controller
{
    // REGISTER
    public function register(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $validatedData['name'],
            'email' => $validatedData['email'],
            'phone' => $validatedData['phone'],
            'password' => Hash::make($validatedData['password']),
            'status' => 'aktif', // AUTO SET STATUS AKTIF
            'email_verified_at' => now(),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registrasi berhasil',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    // LOGIN - TAMBAHKAN CEK STATUS
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        // CEK 1: User ada?
        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        // CEK 2: Status aktif?
        if ($user->status === 'nonaktif') {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda dinonaktifkan. Hubungi administrator.'
            ], 401);
        }

        // CEK 3: Password benar?
        if (!Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:15',
            'profile_photo_url' => 'nullable|url', // Terima URL Cloudinary
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user->name = $request->name;
        $user->email = $request->email;
        $user->phone = $request->phone;

        // Simpan URL Cloudinary ke kolom profile_photo_path
        if ($request->filled('profile_photo_url')) {
            $user->profile_photo_path = $request->profile_photo_url;
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui',
            'data' => $user
        ]);
    }

    public function updateProfilePhoto(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'profile_photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->hasFile('profile_photo')) {
            if ($user->profile_photo_path) {
                Storage::disk('public')->delete($user->profile_photo_path);
            }

            $path = $request->file('profile_photo')->store('profile-photos', 'public');
            $user->profile_photo_path = $path;
            $user->save();
        }

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    public function requestEmailChange(Request $request)
    {
        $user = $request->user();
        $newEmail = $request->input('email');

        // Validasi email baru
        $validator = Validator::make(['email' => $newEmail], [
            'email' => 'required|email|unique:users,email,' . $user->id,
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Generate kode
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Hapus kode lama untuk user ini (opsional)
        PasswordResetCode::where('email', $user->email)
            ->where('purpose', 'email_change')
            ->delete();

        // Simpan kode untuk EMAIL BARU
        PasswordResetCode::create([
            'email' => $user->email,       // email lama (untuk identifikasi user)
            'new_email' => $newEmail,      // email baru
            'code' => $code,
            'expires_at' => now()->addMinutes(5),
            'purpose' => 'email_change'
        ]);

        // Kirim ke EMAIL BARU
        $tempUser = new class($newEmail) {
            use \Illuminate\Notifications\Notifiable;
            public $email;
            public function __construct($email) { $this->email = $email; }
        };
        $tempUser->notify(new PasswordResetCodeNotification($code));

        return response()->json([
            'success' => true,
            'message' => 'Kode verifikasi dikirim ke email baru Anda.'
        ]);
    }

    public function verifyEmailChange(Request $request)
    {
        $user = $request->user();
        $code = $request->input('code');
        $newEmail = $request->input('new_email');

        // Validasi input
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'new_email' => 'required|email|unique:users,email,',
            'code' => 'required|string|size:6'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak valid.',
                'errors' => $validator->errors()
            ], 422);
        }

        $verification = PasswordResetCode::where('email', $user->email) // email lama
            ->where('new_email', $newEmail) // email baru
            ->where('code', $code)
            ->where('purpose', 'email_change')
            ->where('expires_at', '>', now())
            ->first();

        if (!$verification) {
            return response()->json([
                'success' => false,
                'message' => 'Kode tidak valid, kadaluarsa, atau email tidak cocok.'
            ], 422);
        }

        $user->email = $newEmail;
        $user->save();
        $verification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Email berhasil diperbarui.',
            'data' => $user
        ]);
    }

    // GET USER LOGIN
    public function user(Request $request)
    {
        return response()->json([
            'success' => true,
            'user' => $request->user()
        ]);
    }

    // LOGOUT
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil'
        ]);
    }
}