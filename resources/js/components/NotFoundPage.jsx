import React from "react";
import { Link } from "react-router-dom";
import { Home, Shield } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Header */}
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-8">
          Maaf, halaman yang Anda cari tidak tersedia.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-[#FDBD59] hover:bg-[#fda94b] text-black font-medium px-6 py-3 rounded-lg transition shadow-sm"
          >
            <Home size={18} />
            Kembali ke Beranda
          </Link>
          <Link
            to="/LaporPage"
            className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-800 font-medium px-6 py-3 rounded-lg hover:bg-gray-50 transition"
          >
            <Shield size={18} />
            Laporkan Fasilitas
          </Link>
        </div>

        {/* Footer signature */}
        <div className="mt-10 text-sm text-gray-500">
          © {new Date().getFullYear()} SIP-FAS · Sistem Informasi Pelaporan Fasilitas Umum
        </div>
      </div>
    </div>
  );
}