import React, { useState, useEffect } from "react";
import { FileText, CheckCircle, Clock, ShieldAlert, MapPin, Check, Hammer, ClipboardCheck } from "lucide-react";
import Footer from "./Footer";

export default function Statistik() {
  const [statistik, setStatistik] = useState(null);
  const [waktuRespon, setWaktuRespon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState("");
  const [error, setError] = useState("");

  // Base URL API - sesuaikan dengan environment
  const API_BASE_URL = "http://localhost:8000/api";

  const fetchStatistik = async (selectedPeriode = "") => {
    try {
      setLoading(true);
      setError("");
      
      const url = selectedPeriode 
        ? `${API_BASE_URL}/statistik?periode=${encodeURIComponent(selectedPeriode)}`
        : `${API_BASE_URL}/statistik`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStatistik(data.data);
      } else {
        throw new Error(data.message || 'Gagal mengambil data statistik');
      }
    } catch (error) {
      console.error('Error fetching statistik:', error);
      setError("Gagal memuat data statistik. Pastikan backend berjalan di port 8000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchStatistik()
      ]);
    };
    
    loadData();
  }, []);

  const handlePeriodeChange = (e) => {
    const selectedPeriode = e.target.value;
    setPeriode(selectedPeriode);
    
    if (selectedPeriode !== "Pilih") {
      fetchStatistik(selectedPeriode);
    } else {
      fetchStatistik("");
    }
  };

  // Format persentase untuk display
  const formatPersentase = (value) => {
    if (value > 0) return `▲ +${value}%`;
    if (value < 0) return `▼ ${value}%`;
    return `→ ${value}%`;
  };

  // Data fallback untuk loading/error
  const fallbackStatistik = {
    total_laporan: 0,
    laporan_selesai: 0,
    dalam_proses: 0,
    menunggu_verifikasi: 0,
    laporan_per_wilayah: [],
    persentase_perubahan: 0
  };

  const fallbackWaktuRespon = {
    verifikasi: "1-2 Hari",
    perbaikan: "5 Hari",
    selesai: "12 Hari"
  };

  const data = statistik || fallbackStatistik;
  const waktuResponData = waktuRespon || fallbackWaktuRespon;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FDBD59] mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data statistik...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#F9FAFB] px-4 sm:px-8 py-10">
        {/* Header */}
        <div className="bg-white shadow rounded-xl p-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Statistik Pelaporan
          </h1>
          <p className="text-gray-600">
            Pantau perkembangan dan statistik laporan fasilitas publik
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Filter */}
          <div className="mt-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <span className="text-gray-700 font-medium">Filter data</span>
            <div className="flex items-center gap-2">
              <label htmlFor="periode" className="text-gray-700">
                Periode :
              </label>
              <select
                id="periode"
                value={periode}
                onChange={handlePeriodeChange}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#FDBD59] cursor-pointer"
              >
                <option value="Pilih">Semua</option>
                <option value="1 Minggu">1 Minggu</option>
                <option value="1 Bulan">1 Bulan</option>
                <option value="1 Tahun">1 Tahun</option>
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
              <h2 className="text-2xl font-bold text-gray-800">{data.total_laporan}</h2>
              <p className="text-gray-600 text-sm">Total laporan</p>
              <p className={`text-xs font-semibold mt-1 ${
                data.persentase_perubahan > 0 ? 'text-green-500' : 
                data.persentase_perubahan < 0 ? 'text-red-500' : 'text-gray-500'
              }`}>
                {formatPersentase(data.persentase_perubahan)}
              </p>
            </div>
          </div>

          {/* Laporan selesai */}
          <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
            <div className="bg-[#ECFDF5] p-3 rounded-lg">
              <CheckCircle size={28} className="text-[#22C55E]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{data.laporan_selesai}</h2>
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
              <h2 className="text-2xl font-bold text-gray-800">{data.dalam_proses}</h2>
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
              <h2 className="text-2xl font-bold text-gray-800">{data.menunggu_verifikasi}</h2>
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
                <span className="text-gray-900 font-semibold">{waktuResponData.verifikasi}</span>
              </div>

              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-[#FEF3C7] p-2 rounded-lg">
                    <Hammer size={18} className="text-[#F59E0B]" />
                  </div>
                  <p className="text-gray-700 font-medium">Mulai perbaikan</p>
                </div>
                <span className="text-gray-900 font-semibold">{waktuResponData.perbaikan}</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-[#ECFDF5] p-2 rounded-lg">
                    <ClipboardCheck size={18} className="text-[#22C55E]" />
                  </div>
                  <p className="text-gray-700 font-medium">Selesai diperbaiki</p>
                </div>
                <span className="text-gray-900 font-semibold">{waktuResponData.selesai}</span>
              </div>
            </div>
          </div>

          {/* Laporan per wilayah */}
          <div className="bg-white shadow rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Laporan per wilayah
            </h3>

            <div className="space-y-4">
              {data.laporan_per_wilayah && data.laporan_per_wilayah.length > 0 ? (
                data.laporan_per_wilayah.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center border-b pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-[#F3F4F6] p-2 rounded-lg">
                        <MapPin size={18} className="text-gray-700" />
                      </div>
                      <p className="text-gray-700 font-medium">{item.lokasi}</p>
                    </div>
                    <span className="text-gray-900 font-semibold">{item.total}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  Tidak ada data laporan per wilayah
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}