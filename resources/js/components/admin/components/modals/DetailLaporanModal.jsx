import React, { useState, useEffect } from "react";
import { X, Calendar, MapPin, User, AlertCircle, Users, Clock } from "lucide-react";
import axios from "axios";

export default function DetailLaporanModal({
    selectedLaporan,
    onClose,
    showNotification,
    fetchLaporanData
}) {
    const [formData, setFormData] = useState({
        status: "",
        catatan: ""
    });
    const [availablePetugas, setAvailablePetugas] = useState([]);
    const [petugasDitugaskan, setPetugasDitugaskan] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (selectedLaporan) {
            setFormData({
                status: selectedLaporan.status || "",
                catatan: selectedLaporan.catatan || ""
            });
            
            fetchPetugasData();
        }
    }, [selectedLaporan]);

    const fetchPetugasData = async () => {
        try {
            // Fetch petugas aktif
            const token = localStorage.getItem("admin_token");
            const response = await axios.get("http://localhost:8000/api/admin/petugas/aktif", {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setAvailablePetugas(response.data.data);
            }

            // Fetch petugas yang sudah ditugaskan ke laporan ini
            const petugasResponse = await axios.get(
                `http://localhost:8000/api/laporan/${selectedLaporan.id}/petugas`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (petugasResponse.data.success && petugasResponse.data.data.length > 0) {
                setPetugasDitugaskan(petugasResponse.data.data[0]);
            }
        } catch (error) {
            console.error("Error fetching petugas:", error);
        }
    };

    const handleAssignPetugas = async (petugasId) => {
        try {
            const token = localStorage.getItem("admin_token");
            
            const response = await axios.post(
                "http://localhost:8000/api/admin/petugas/assign-laporan",
                {
                    laporan_id: selectedLaporan.id,
                    petugas_id: petugasId,
                    catatan: formData.catatan || "Ditugaskan melalui detail laporan"
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                showNotification("Petugas berhasil ditugaskan ke laporan", "success");
                fetchPetugasData();
                if (fetchLaporanData) fetchLaporanData();
            }
        } catch (error) {
            console.error("Error assigning petugas:", error);
            const errorMsg = error.response?.data?.message || "Gagal menugaskan petugas";
            showNotification(errorMsg, "error");
        }
    };

    const handleReleasePetugas = async () => {
        if (!petugasDitugaskan) return;

        if (!window.confirm(`Apakah Anda yakin ingin melepas petugas ${petugasDitugaskan.nama} dari laporan ini?`)) {
            return;
        }

        try {
            const token = localStorage.getItem("admin_token");
            
            const response = await axios.post(
                "http://localhost:8000/api/admin/petugas/release-laporan",
                {
                    laporan_id: selectedLaporan.id,
                    petugas_id: petugasDitugaskan.id,
                    catatan: formData.catatan || "Dilepas melalui detail laporan"
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                showNotification("Petugas berhasil dilepas dari laporan", "success");
                setPetugasDitugaskan(null);
                fetchPetugasData();
                if (fetchLaporanData) fetchLaporanData();
            }
        } catch (error) {
            console.error("Error releasing petugas:", error);
            const errorMsg = error.response?.data?.message || "Gagal melepas petugas";
            showNotification(errorMsg, "error");
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        try {
            const token = localStorage.getItem("admin_token");
            
            const response = await axios.put(
                `http://localhost:8000/api/admin/laporan/${selectedLaporan.id}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                showNotification(`Status berhasil diubah menjadi "${newStatus}"`, "success");
                setFormData({...formData, status: newStatus});
                if (fetchLaporanData) fetchLaporanData();
            }
        } catch (error) {
            console.error("Error updating status:", error);
            showNotification("Gagal mengubah status", "error");
        }
    };

    const getStatusColor = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === "validasi") return "bg-yellow-100 text-yellow-800";
        if (statusLower === "tervalidasi") return "bg-green-100 text-green-800";
        if (statusLower === "dalam proses") return "bg-blue-100 text-blue-800";
        if (statusLower === "selesai") return "bg-gray-100 text-gray-800";
        if (statusLower === "ditolak") return "bg-red-100 text-red-800";
        return "bg-gray-100 text-gray-800";
    };

    // Filter petugas yang tersedia (tidak sedang dalam tugas)
    const getPetugasTersedia = () => {
        return availablePetugas.filter(petugas => {
            // Cek apakah petugas sudah ditugaskan ke laporan ini
            if (petugasDitugaskan && petugas.id === petugasDitugaskan.id) {
                return false;
            }
            
            // Cek apakah petugas sedang dalam tugas
            if (petugas.laporans && Array.isArray(petugas.laporans)) {
                const dalamTugas = petugas.laporans.some(laporan => {
                    const statusTugas = laporan.pivot?.status_tugas;
                    return statusTugas && ["Dikirim", "Diterima", "Dalam Pengerjaan"].includes(statusTugas);
                });
                return !dalamTugas;
            }
            
            return true;
        });
    };

    return (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Detail Laporan</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Info Laporan */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedLaporan.judul}</h3>
                            <div className="space-y-2">
                                <div className="flex items-center text-gray-600">
                                    <MapPin className="w-4 h-4 mr-2" />
                                    <span>{selectedLaporan.lokasi}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <User className="w-4 h-4 mr-2" />
                                    <span>{selectedLaporan.pelapor_nama}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <span>{selectedLaporan.created_at?.split('T')[0]}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <div className="mb-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedLaporan.status)}`}>
                                    {selectedLaporan.status}
                                </span>
                            </div>
                            
                            {petugasDitugaskan && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center mb-2">
                                        <Users className="w-5 h-5 text-blue-600 mr-2" />
                                        <h4 className="font-medium text-blue-900">Petugas Ditugaskan</h4>
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-medium">{petugasDitugaskan.nama}</div>
                                        <div className="text-blue-700">{petugasDitugaskan.nomor_telepon}</div>
                                        <div className="text-gray-600 text-xs mt-1">
                                            Status Tugas: {petugasDitugaskan.pivot?.status_tugas || 'Dikirim'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Deskripsi */}
                    <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-2">Deskripsi</h4>
                        <p className="text-gray-600">{selectedLaporan.deskripsi}</p>
                    </div>

                    {/* Penugasan Petugas */}
                    <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                <Clock className="w-5 h-5 mr-2" />
                                Penugasan Petugas
                            </h3>
                            
                            <div className="flex space-x-2">
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm cursor-pointer"
                                >
                                    <option value="">Ubah Status</option>
                                    <option value="Validasi">Validasi</option>
                                    <option value="Tervalidasi">Tervalidasi</option>
                                    <option value="Dalam Proses">Dalam Proses</option>
                                    <option value="Selesai">Selesai</option>
                                    <option value="Ditolak">Ditolak</option>
                                </select>
                                
                                <button
                                    onClick={() => handleUpdateStatus(formData.status)}
                                    disabled={!formData.status}
                                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                                >
                                    Update
                                </button>
                            </div>
                        </div>

                        {petugasDitugaskan ? (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-medium">{petugasDitugaskan.nama}</div>
                                        <div className="text-sm text-gray-600">{petugasDitugaskan.alamat}</div>
                                        <div className="text-sm text-gray-500">{petugasDitugaskan.nomor_telepon}</div>
                                    </div>
                                    <button
                                        onClick={handleReleasePetugas}
                                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 cursor-pointer"
                                    >
                                        Lepaskan
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-gray-600 mb-3">Pilih petugas untuk menangani laporan ini:</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {getPetugasTersedia().map((petugas) => (
                                        <div 
                                            key={petugas.id}
                                            className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 cursor-pointer"
                                            onClick={() => handleAssignPetugas(petugas.id)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-medium text-gray-900">{petugas.nama}</div>
                                                    <div className="text-sm text-gray-500">{petugas.nomor_telepon}</div>
                                                    <div className="text-xs text-gray-400 mt-1">{petugas.alamat}</div>
                                                </div>
                                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                                    Tersedia
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {getPetugasTersedia().length === 0 && (
                                    <p className="text-gray-500 text-center py-4">
                                        Tidak ada petugas yang tersedia. Semua petugas sedang dalam tugas.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}