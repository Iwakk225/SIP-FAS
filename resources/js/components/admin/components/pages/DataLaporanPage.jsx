import React, { useState, useEffect } from "react";
import { RefreshCw, Search, Calendar } from "lucide-react";
import DetailLaporanModal from "../modals/DetailLaporanModal";

export default function DataLaporanPage({ 
    laporanData, 
    isLoading, 
    fetchLaporanData,
    showNotification 
}) {
    const [selectedLaporan, setSelectedLaporan] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState("Semua Status");
    const [searchTerm, setSearchTerm] = useState(""); // <-- Tambah state search
    const [tanggalFilter, setTanggalFilter] = useState(""); // <-- Tambah state filter tanggal
    const [filteredData, setFilteredData] = useState([]); // <-- data hasil filter

    // Efek untuk memfilter data saat laporanData, statusFilter, searchTerm atau tanggalFilter berubah
    useEffect(() => {
        if (!Array.isArray(laporanData)) {
            setFilteredData([]);
            return;
        }

        let result = [...laporanData];

        // Filter berdasarkan status
        if (statusFilter !== "Semua Status") {
            const filterValue = statusFilter.toLowerCase();
            result = result.filter((laporan) => {
                const status = (laporan.status || "").toLowerCase().replace(/\s+/g, "_");
                if (filterValue === "validasi") return status === "validasi" || status === "pending";
                if (filterValue === "tervalidasi") return status === "tervalidasi" || status === "validated";
                if (filterValue === "dalam proses") return ["dalam_proses", "dalam proses", "in_progress"].includes(status);
                if (filterValue === "selesai") return status === "selesai" || status === "completed";
                if (filterValue === "ditolak") return status === "ditolak" || status === "rejected";
                return false;
            });
        }

        // Filter berdasarkan judul
        if (searchTerm) {
            result = result.filter((laporan) =>
                laporan.judul.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter berdasarkan tanggal
        if (tanggalFilter) {
            result = result.filter((laporan) => {
                const laporanDate = new Date(laporan.created_at).toISOString().split('T')[0];
                return laporanDate === tanggalFilter;
            });
        }

        setFilteredData(result);
    }, [laporanData, statusFilter, searchTerm, tanggalFilter]);

    const getStatusColor = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === "ditolak" || statusLower === "rejected") return "bg-rose-100 text-rose-700 border border-rose-200";
        if (statusLower === "validasi" || statusLower === "pending") return "bg-amber-100 text-amber-700 border border-amber-200";
        if (statusLower === "tervalidasi" || statusLower === "validated") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
        if (statusLower === "dalam_proses" || statusLower === "dalam proses" || statusLower === "in_progress") 
            return "bg-indigo-100 text-indigo-700 border border-indigo-200";
        if (statusLower === "selesai" || statusLower === "completed") return "bg-slate-100 text-slate-700 border border-slate-200";
        return "bg-slate-100 text-slate-700 border border-slate-200";
    };

    const getStatusText = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === "ditolak" || statusLower === "rejected") return "Ditolak";
        if (statusLower === "validasi" || statusLower === "pending") return "Validasi";
        if (statusLower === "tervalidasi" || statusLower === "validated") return "Tervalidasi";
        if (statusLower === "dalam_proses" || statusLower === "dalam proses" || statusLower === "in_progress") 
            return "Dalam Proses";
        if (statusLower === "selesai" || statusLower === "completed") return "Selesai";
        return status;
    };

    const handleDetailClick = (laporan) => {
        setSelectedLaporan(laporan);
        setShowDetailModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Data Laporan</h1>
                    <p className="text-gray-600">Kelola semua laporan fasilitas umum dari database</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                    <button
                        onClick={fetchLaporanData}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors disabled:opacity-50 flex items-center space-x-2 shadow-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </button>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm cursor-pointer"
                    >
                        <option>Semua Status</option>
                        <option>Validasi</option>
                        <option>Tervalidasi</option>
                        <option>Dalam Proses</option>
                        <option>Selesai</option>
                        <option>Ditolak</option>
                    </select>
                </div>
            </div>

            {/* Baris input search dan filter tanggal */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Cari judul laporan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 pr-4 py-2.5 w-full border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#FDBD59] focus:border-[#FDBD59] transition-all bg-white text-sm text-slate-800 placeholder-slate-400 font-medium outline-none"
                        />
                    </div>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input
                            type="date"
                            value={tanggalFilter}
                            onChange={(e) => setTanggalFilter(e.target.value)}
                            className="pl-11 pr-4 py-2.5 w-full border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#FDBD59] focus:border-[#FDBD59] transition-all bg-white text-sm text-slate-800 font-medium outline-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
                    <p className="text-gray-600">Memuat data laporan dari database...</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100 border-b border-slate-200">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">NO</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">JUDUL LAPORAN</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">LOKASI</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">WAKTU</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">STATUS</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">AKSI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredData.length > 0 ? (
                                    filteredData.map((laporan, index) => (
                                        <tr key={laporan.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 text-sm font-medium text-slate-800">{index + 1}</td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900 mb-0.5">{laporan.judul}</div>
                                                    <div className="text-xs font-medium text-slate-600">Pelapor: <span className="font-semibold text-slate-800">{laporan.pelapor_nama}</span></div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-800">{laporan.lokasi}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-700">
                                                {new Date(laporan.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getStatusColor(laporan.status)}`}>
                                                    {getStatusText(laporan.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDetailClick(laporan)}
                                                    className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm shadow-indigo-600/20"
                                                >
                                                    Detail
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                            {filteredData.length === 0 && (searchTerm || tanggalFilter || statusFilter !== "Semua Status")
                                                ? "Tidak ditemukan laporan dengan kriteria yang dipilih."
                                                : "Belum ada laporan yang masuk"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showDetailModal && (
                <DetailLaporanModal
                    selectedLaporan={selectedLaporan}
                    onClose={() => setShowDetailModal(false)}
                    showNotification={showNotification}
                />
            )}
        </div>
    );
}