import React from "react";
import { FileText, CheckCircle, Clock, ShieldAlert, MapPin, Check, Hammer, ClipboardCheck } from "lucide-react";
import NavbarBeforeLogin from "./NavbarBeforeLogin";
import Footer from "./Footer";

export default function Statistik() {
  return (
    <>
    <NavbarBeforeLogin/>
    <div className="min-h-screen bg-[#F9FAFB] px-4 sm:px-8 py-10">
      {/* Header */}
      <div className="bg-white shadow rounded-xl p-6 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          Statistik Pelaporan
        </h1>
        <p className="text-gray-600">
          Pantau perkembangan dan statistik laporan fasilitas publik
        </p>

        {/* Filter */}
        <div className="mt-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <span className="text-gray-700 font-medium">Filter data</span>
          <div className="flex items-center gap-2">
            <label htmlFor="periode" className="text-gray-700">
              Periode :
            </label>
            <select
              id="periode"
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#FDBD59]"
            >
              <option>Pilih</option>
              <option>1 Minggu</option>
              <option>1 Bulan</option>
              <option>1 Tahun</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistik Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total laporan */}
        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className="bg-[#EEF2FF] p-3 rounded-lg">
            <FileText size={28} className="text-[#4F46E5]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">200</h2>
            <p className="text-gray-600 text-sm">Total laporan</p>
            <p className="text-green-500 text-xs font-semibold mt-1">▲ +12%</p>
          </div>
        </div>

        {/* Laporan selesai */}
        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className="bg-[#ECFDF5] p-3 rounded-lg">
            <CheckCircle size={28} className="text-[#22C55E]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">169</h2>
            <p className="text-gray-600 text-sm">Laporan selesai</p>
            <p className="text-green-500 text-xs font-semibold mt-1">▲ +8%</p>
          </div>
        </div>

        {/* Dalam proses */}
        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className="bg-[#FEFCE8] p-3 rounded-lg">
            <Clock size={28} className="text-[#FACC15]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">11</h2>
            <p className="text-gray-600 text-sm">Dalam proses</p>
            <p className="text-green-500 text-xs font-semibold mt-1">▲ +10%</p>
          </div>
        </div>

        {/* Menunggu verifikasi */}
        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className="bg-[#FEF2F2] p-3 rounded-lg">
            <ShieldAlert size={28} className="text-[#EF4444]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">20</h2>
            <p className="text-gray-600 text-sm">Menunggu verifikasi</p>
            <p className="text-red-500 text-xs font-semibold mt-1">▼ -4%</p>
          </div>
        </div>
      </div>

      {/* Bagian bawah (dua card besar) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Waktu respon rata-rata */}
        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Waktu respon rata - rata
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="bg-[#EEF2FF] p-2 rounded-lg">
                  <Check size={18} className="text-[#4F46E5]" />
                </div>
                <p className="text-gray-700 font-medium">Verifikasi</p>
              </div>
              <span className="text-gray-900 font-semibold">1-2 Hari</span>
            </div>

            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="bg-[#FEF3C7] p-2 rounded-lg">
                  <Hammer size={18} className="text-[#F59E0B]" />
                </div>
                <p className="text-gray-700 font-medium">Mulai perbaikan</p>
              </div>
              <span className="text-gray-900 font-semibold">5 Hari</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-[#ECFDF5] p-2 rounded-lg">
                  <ClipboardCheck size={18} className="text-[#22C55E]" />
                </div>
                <p className="text-gray-700 font-medium">Selesai diperbaiki</p>
              </div>
              <span className="text-gray-900 font-semibold">12 Hari</span>
            </div>
          </div>
        </div>

        {/* Laporan per wilayah */}
        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Laporan per wilayah
          </h3>

          <div className="space-y-4">
            {[
              { wilayah: "Surabaya Pusat", jumlah: 34 },
              { wilayah: "Surabaya Utara", jumlah: 45 },
              { wilayah: "Surabaya Timur", jumlah: 40 },
              { wilayah: "Surabaya Selatan", jumlah: 38 },
              { wilayah: "Surabaya Barat", jumlah: 12 },
            ].map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center border-b last:border-b-0 pb-3 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-[#F3F4F6] p-2 rounded-lg">
                    <MapPin size={18} className="text-gray-700" />
                  </div>
                  <p className="text-gray-700 font-medium">{item.wilayah}</p>
                </div>
                <span className="text-gray-900 font-semibold">{item.jumlah}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    <Footer/>
    </>
  );
}
