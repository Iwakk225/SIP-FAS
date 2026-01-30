import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import DetailLaporanModal from "../modals/DetailLaporanModal";

export default function DataLaporanPage({ 
    laporanData, 
    isLoading, 
    fetchLaporanData,
    showNotification 
}) {
    const [selectedLaporan, setSelectedLaporan] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const getStatusColor = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === "ditolak" || statusLower === "rejected") return "bg-red-100 text-red-800";
        if (statusLower === "validasi" || statusLower === "pending") return "bg-yellow-100 text-yellow-800";
        if (statusLower === "tervalidasi" || statusLower === "validated") return "bg-green-100 text-green-800";
        if (statusLower === "dalam_proses" || statusLower === "dalam proses" || statusLower === "in_progress") 
            return "bg-blue-100 text-blue-800";
        if (statusLower === "selesai" || statusLower === "completed") return "bg-gray-100 text-gray-800";
        return "bg-gray-100 text-gray-800";
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
                <div className="flex space-x-2 mt-4 md:mt-0">
                    <button
                        onClick={fetchLaporanData}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </button>
                    <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        <option>Semua Waktu</option>
                        <option>Hari Ini</option>
                        <option>Minggu Ini</option>
                        <option>Bulan Ini</option>
                    </select>
                    <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        <option>Semua Status</option>
                        <option>Validasi</option>
                        <option>Tervalidasi</option>
                        <option>Dalam Proses</option>
                        <option>Selesai</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
                    <p className="text-gray-600">Memuat data laporan dari database...</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NO</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">JUDUL LAPORAN</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">LOKASI</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">WAKTU</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STATUS</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AKSI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {laporanData.length > 0 ? (
                                    laporanData.map((laporan, index) => (
                                        <tr key={laporan.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{laporan.judul}</div>
                                                    <div className="text-sm text-gray-500">Pelapor: {laporan.pelapor_nama}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{laporan.lokasi}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {laporan.tanggal || laporan.created_at?.split("T")[0]}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(laporan.status)}`}>
                                                    {getStatusText(laporan.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDetailClick(laporan)}
                                                    className="text-blue-600 hover:text-blue-900 text-sm font-medium cursor-pointer"
                                                >
                                                    Detail
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                            Belum ada laporan yang masuk
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