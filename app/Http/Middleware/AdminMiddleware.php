<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        // **SEMENTARA: BYPASS SEMUA - return langsung**
        return $next($request);
        
        /*
        // Kode asli (comment dulu untuk testing)
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $user = Auth::user();
        
        // Cek jika ada kolom 'role'
        if (!isset($user->role) || $user->role !== 'admin') {
            // Atau cek email tertentu
            $adminEmails = ['admin@example.com', 'administrator@example.com'];
            if (!in_array($user->email, $adminEmails)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin only.'
                ], 403);
            }
        }

        return $next($request);
        */
    }
}