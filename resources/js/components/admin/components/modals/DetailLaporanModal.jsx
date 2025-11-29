import React, { useState, useEffect } from "react";
import { X, MapPin, Calendar, User as UserIcon, AlertCircle, Upload } from "lucide-react";
import axios from "axios";
import AssignPetugasModal from "./AssignPetugasModal";
import UploadBuktiModal from "./UploadBuktiModal";

export default function DetailLaporanModal({ selectedLaporan, onClose, showNotification }) {
    const [petugasLaporan, setPetugasLaporan] = useState([]);
    const [showAssignPetugasModal, setShowAssignPetugasModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    useEffect(() => {
        if (selectedLaporan) {
            fetchPetugasLaporan(selectedLaporan.id);
        }
    }, [selectedLaporan]);

    const fetchPetugasLaporan = async (laporanId) => {
        try {
            const token = localStorage.getItem("admin_token");
            const response = await axios.get(
                `http://localhost:8000/api/admin/laporan/${laporanId}/petugas`,
                { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
            );

            if (response.data.success) {
                setPetugasLaporan(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching petugas laporan:", error);
        }
    };

    const handleValidateLaporan = async (laporanId) => {
        try {
            const token = localStorage.getItem("admin_token");
            const response = await axios.put(
                `http://localhost:8000/api/admin/laporan/${laporanId}/validate`,
                { status: "Tervalidasi" },
                { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
            );

            if (response.data.success) {
                showNotification("Laporan berhasil divalidasi!", "success");
                onClose();
            }
        } catch (error) {
            console.error("Error validating laporan:", error);
            showNotification("Gagal memvalidasi laporan", "error");
        }
    };

    const handleUpdateStatus = async (laporanId, newStatus) => {
        try {
            const token = localStorage.getItem("admin_token");
            const response = await axios.put(
                `http://localhost:8000/api/admin/laporan/${laporanId}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
            );

            if (response.data.success) {
                showNotification(`Status berhasil diubah menjadi: ${newStatus}`, "success");
                onClose();
            }
        } catch (error) {
            console.error("Error updating laporan status:", error);
            showNotification("Gagal mengupdate status laporan", "error");
        }
    };

    const getStatusColor = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === "validasi" || statusLower === "pending") return "bg-yellow-100 text-yellow-800";
        if (statusLower === "tervalidasi" || statusLower === "validated") return "bg-green-100 text-green-800";
        if (statusLower === "dalam_proses" || statusLower === "dalam proses" || statusLower === "in_progress") 
            return "bg-blue-100 text-blue-800";
        if (statusLower === "selesai" || statusLower === "completed") return "bg-gray-100 text-gray-800";
        return "bg-gray-100 text-gray-800";
    };

    const getStatusText = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === "validasi" || statusLower === "pending") return "Validasi";
        if (statusLower === "tervalidasi" || statusLower === "validated") return "Tervalidasi";
        if (statusLower === "dalam_proses" || statusLower === "dalam proses" || statusLower === "in_progress") 
            return "Dalam Proses";
        if (statusLower === "selesai" || statusLower === "completed") return "Selesai";
        return status;
    };

    if (!selectedLaporan) return null;

    return (
        <>
            <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="border-b border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Detail Laporan</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedLaporan.judul}</h3>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-gray-700">{selectedLaporan.deskripsi}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start space-x-3">
                                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Lokasi</p>
                                    <p className="text-sm text-gray-900">{selectedLaporan.lokasi}</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Status</p>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedLaporan.status)}`}>
                                        {getStatusText(selectedLaporan.status)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Tanggal Laporan</p>
                                    <p className="text-sm text-gray-900">
                                        {selectedLaporan.tanggal || selectedLaporan.created_at?.split("T")[0]}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <UserIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Pelapor</p>
                                    <p className="text-sm text-gray-900">{selectedLaporan.pelapor_nama}</p>
                                </div>
                            </div>
                        </div>

                        {petugasLaporan.length > 0 && (
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Petugas yang Ditugaskan</h3>
                                <div className="space-y-3">
                                    {petugasLaporan.map((petugas) => (
                                        <div key={petugas.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold text-green-900">{petugas.nama}</h4>
                                                    <p className="text-sm text-green-700">{petugas.alamat}</p>
                                                    <p className="text-sm text-green-700">{petugas.nomor_telepon}</p>
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                                                        {petugas.pivot?.status_tugas || "Dikirim"}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-green-600">
                                                    Dikirim: {new Date(petugas.pivot?.dikirim_pada).toLocaleDateString("id-ID")}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedLaporan.foto_laporan && selectedLaporan.foto_laporan.length > 0 && (
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Foto Laporan</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {selectedLaporan.foto_laporan.map((foto, index) => (
                                        <img
                                            key={index}
                                            src={foto}
                                            alt={`Foto laporan ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                                            onClick={() => window.open(foto, "_blank")}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium cursor-pointer transition-colors flex items-center"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Bukti Perbaikan
                            </button>

                            {(selectedLaporan.status === "Tervalidasi" || selectedLaporan.status === "tervalidasi") && !petugasLaporan.length && (
                                <button
                                    onClick={() => setShowAssignPetugasModal(true)}
                                    className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg font-medium cursor-pointer transition-colors"
                                >
                                    Kirim Petugas
                                </button>
                            )}

                            {(selectedLaporan.status === "Validasi" || selectedLaporan.status === "validasi") && (
                                <button
                                    onClick={() => handleValidateLaporan(selectedLaporan.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium cursor-pointer transition-colors"
                                >
                                    Validasi Laporan
                                </button>
                            )}

                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ubah Status:</label>
                                <select
                                    onChange={(e) => handleUpdateStatus(selectedLaporan.id, e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedLaporan.status}
                                >
                                    <option value="Validasi">Menunggu Validasi</option>
                                    <option value="Tervalidasi">Tervalidasi</option>
                                    <option value="Dalam Proses">Dalam Proses</option>
                                    <option value="Selesai">Selesai</option>
                                    <option value="Ditolak">Ditolak</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showAssignPetugasModal && (
                <AssignPetugasModal
                    showAssignPetugasModal={showAssignPetugasModal}
                    setShowAssignPetugasModal={setShowAssignPetugasModal}
                    selectedLaporanForAssign={selectedLaporan}
                    showNotification={showNotification}
                />
            )}

            {showUploadModal && (
                <UploadBuktiModal
                    showUploadModal={showUploadModal}
                    setShowUploadModal={setShowUploadModal}
                    selectedLaporanForUpload={selectedLaporan}
                    showNotification={showNotification}
                />
            )}
        </>
    );
}