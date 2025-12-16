import React, { useState, useEffect } from "react";
import {
    X,
    Calendar,
    MapPin,
    User,
    AlertCircle,
    Users,
    Clock,
    Upload,
    CheckCircle,
    FileText,
    Image as ImageIcon
} from "lucide-react";
import axios from "axios";
import UploadBuktiModal from "./UploadBuktiModal";

export default function DetailLaporanModal({
    selectedLaporan,
    onClose,
    showNotification,
    fetchLaporanData,
}) {
    const [formData, setFormData] = useState({
        status: "",
        catatan: "",
    });
    const [availablePetugas, setAvailablePetugas] = useState([]);
    const [petugasDitugaskan, setPetugasDitugaskan] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedLaporanForUpload, setSelectedLaporanForUpload] = useState(null);
    const [buktiPhotos, setBuktiPhotos] = useState([]);
    const [rincianFile, setRincianFile] = useState(null);

    useEffect(() => {
        if (selectedLaporan) {
            setFormData({
                status: selectedLaporan.status || "",
                catatan: selectedLaporan.catatan || "",
            });

            const loadData = async () => {
                await fetchPetugasData();
                await checkPetugasLaporan();
                loadBuktiData();
            };
            
            loadData();
            
            return () => {
                console.log("🧹 Cleaning up modal data");
                setAvailablePetugas([]);
                setPetugasDitugaskan(null);
            };
        }
    }, [selectedLaporan]);

    // Function untuk cek petugas laporan
    const checkPetugasLaporan = async () => {
        try {
            const token = localStorage.getItem("admin_token");
            
            const endpoints = [
                `http://localhost:8000/api/admin/laporan/${selectedLaporan.id}/petugas`,
                `http://localhost:8000/api/laporan/${selectedLaporan.id}/petugas`
            ];
            
            let response = null;
            
            for (const endpoint of endpoints) {
                try {
                    response = await axios.get(endpoint, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (response.data.success) break;
                } catch (err) {
                    console.log(`Endpoint ${endpoint} failed, trying next...`);
                    continue;
                }
            }
            
            if (response?.data.success && response.data.data.length > 0) {
                const petugas = response.data.data[0];
                setPetugasDitugaskan(petugas);
                console.log("✅ Petugas sudah ditugaskan:", petugas.nama);
            } else {
                console.log("ℹ️ Tidak ada petugas yang ditugaskan ke laporan ini");
                setPetugasDitugaskan(null);
            }
        } catch (error) {
            console.error("Error checking petugas laporan:", error);
        }
    };

    const fetchPetugasData = async () => {
        try {
            const token = localStorage.getItem("admin_token");
            
            const response = await axios.get(
                `http://localhost:8000/api/admin/petugas/tersedia?laporan_id=${selectedLaporan.id}`,
                {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Accept': 'application/json'
                    },
                }
            );

            if (response.data.success) {
                setAvailablePetugas(response.data.data);
            }
        } catch (error) {
            console.error("❌ Error fetching petugas:", error);
        }
    };

    const loadBuktiData = () => {
        if (selectedLaporan.foto_bukti_perbaikan && Array.isArray(selectedLaporan.foto_bukti_perbaikan)) {
            const existingPhotos = selectedLaporan.foto_bukti_perbaikan.map(url => ({
                preview: url,
                isExisting: true
            }));
            setBuktiPhotos(existingPhotos);
        }
    };

    // Handle assign petugas
    const handleAssignPetugas = async (petugasId) => {
        const laporanId = parseInt(selectedLaporan.id);
        const pid = parseInt(petugasId);

        if (isNaN(laporanId) || isNaN(pid)) {
            showNotification("ID laporan atau petugas tidak valid", "error");
            return;
        }

        try {
            setIsLoading(true);
            const token = localStorage.getItem("admin_token");

            const response = await axios.post(
                "http://localhost:8000/api/admin/petugas/assign-laporan",
                {
                    laporan_id: laporanId,
                    petugas_id: pid,
                    catatan: formData.catatan || "Ditugaskan melalui detail laporan",
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                showNotification("Petugas berhasil ditugaskan ke laporan", "success");
                
                const petugasYangDipilih = availablePetugas.find(p => p.id === pid);
                
                if (petugasYangDipilih) {
                    setPetugasDitugaskan({
                        ...petugasYangDipilih,
                        pivot: {
                            status_tugas: 'Dikirim',
                            dikirim_pada: new Date().toISOString(),
                            is_active: 1
                        }
                    });
                }
                
                fetchPetugasData();
                
                if (fetchLaporanData) {
                    setTimeout(() => fetchLaporanData(), 300);
                }
            }
        } catch (error) {
            console.error("Error assigning petugas:", error);
            const errorMsg = error.response?.data?.message || "Gagal menugaskan petugas";
            showNotification(errorMsg, "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle release petugas
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
                    laporan_id: parseInt(selectedLaporan.id),
                    petugas_id: parseInt(petugasDitugaskan.id),
                    catatan: formData.catatan || "Dilepas melalui detail laporan",
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

    // Handle update status laporan - 🔥 INI YANG PENTING
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
                setFormData({ ...formData, status: newStatus });
                
                // 🔥 AUTO-UPDATE: Jika status laporan "Selesai" atau "Ditolak"
                if ((newStatus === "Selesai" || newStatus === "Ditolak") && petugasDitugaskan) {
                    showNotification(
                        `Petugas "${petugasDitugaskan.nama}" sekarang TERSEDIA kembali untuk ditugaskan ke laporan lain`,
                        "info"
                    );
                    
                    // Auto-release petugas dari laporan ini
                    try {
                        await axios.post(
                            "http://localhost:8000/api/admin/petugas/release-laporan",
                            {
                                laporan_id: parseInt(selectedLaporan.id),
                                petugas_id: parseInt(petugasDitugaskan.id),
                                catatan: `Auto-release karena laporan ${newStatus}`
                            },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        
                        setPetugasDitugaskan(null);
                        fetchPetugasData(); // Refresh list petugas tersedia
                    } catch (releaseError) {
                        console.error("Auto-release error:", releaseError);
                    }
                }
                
                if (fetchLaporanData) {
                    setTimeout(() => fetchLaporanData(), 300);
                }
            }
        } catch (error) {
            console.error("Error updating status:", error);
            showNotification("Gagal mengubah status", "error");
        }
    };

    const handleUploadSuccess = (laporanId) => {
    console.log("✅ Upload berhasil untuk laporan ID:", laporanId);
    
    // Refresh data laporan
    if (fetchLaporanData) {
        setTimeout(() => {
            fetchLaporanData();
        }, 1000);
    }
    
    // Close modal upload
    setShowUploadModal(false);
    
    // Bisa juga reload detail laporan yang sedang dilihat
    if (selectedLaporan.id === laporanId) {
        // Fetch ulang data laporan ini saja
        console.log("Reloading current laporan data...");
    }
};

    const handleOpenUploadModal = () => {
        setSelectedLaporanForUpload(selectedLaporan);
        setShowUploadModal(true);
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

    const getPetugasTersedia = () => {
        if (availablePetugas.length === 0) return [];
        
        const filtered = availablePetugas.filter(petugas => {
            if (petugasDitugaskan && petugas.id === petugasDitugaskan.id) {
                return false;
            }
            
            if (petugas.status !== 'Aktif') {
                return false;
            }
            
            return true;
        });
        
        return filtered;
    };

    const isLaporanSelesai = ["Dalam Proses", "Tervalidasi", "Selesai"].includes(selectedLaporan.status);

    return (
        <>
            <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                Detail Laporan
                            </h2>
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
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {selectedLaporan.judul}
                                </h3>
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
                                        <span>{selectedLaporan.created_at?.split("T")[0]}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="mb-4">
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedLaporan.status)}`}
                                    >
                                        {selectedLaporan.status}
                                    </span>
                                </div>

                                {petugasDitugaskan && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center mb-2">
                                            <Users className="w-5 h-5 text-blue-600 mr-2" />
                                            <h4 className="font-medium text-blue-900">
                                                Petugas Ditugaskan
                                            </h4>
                                        </div>
                                        <div className="text-sm">
                                            <div className="font-medium">
                                                {petugasDitugaskan.nama}
                                            </div>
                                            <div className="text-blue-700">
                                                {petugasDitugaskan.nomor_telepon}
                                            </div>
                                            <div className="text-gray-600 text-xs mt-1">
                                                {petugasDitugaskan.alamat}
                                            </div>
                                            <div className="text-gray-500 text-xs mt-1">
                                                {petugasDitugaskan.pivot?.dikirim_pada 
                                                    ? `Ditugaskan: ${new Date(petugasDitugaskan.pivot.dikirim_pada).toLocaleDateString('id-ID')}`
                                                    : "Baru ditugaskan"}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Foto Laporan */}
                        {selectedLaporan.foto_laporan?.length > 0 && (
                            <div className="mb-6">
                                <h4 className="font-medium text-gray-900 mb-3">
                                    Foto Laporan
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {selectedLaporan.foto_laporan.map((foto, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={foto}
                                                alt={`Foto laporan ${index + 1}`}
                                                className="w-full h-40 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => window.open(foto, "_blank")}
                                            />
                                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                                Foto {index + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bukti Perbaikan */}
                        {(selectedLaporan.foto_bukti_perbaikan?.length > 0 || selectedLaporan.rincian_biaya_pdf) && (
                            <div className="mb-6 border-t pt-6">
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                                    Bukti Perbaikan
                                </h4>
                                
                                {selectedLaporan.foto_bukti_perbaikan?.length > 0 && (
                                    <div className="mb-4">
                                        <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                            <ImageIcon className="w-4 h-4 mr-1" />
                                            Foto Bukti Perbaikan
                                        </h5>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {selectedLaporan.foto_bukti_perbaikan.map((foto, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={foto}
                                                        alt={`Bukti perbaikan ${index + 1}`}
                                                        className="w-full h-32 object-cover rounded-lg border border-green-200 cursor-pointer hover:opacity-90 transition-opacity"
                                                        onClick={() => window.open(foto, "_blank")}
                                                    />
                                                    <div className="absolute bottom-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                                                        Bukti {index + 1}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedLaporan.rincian_biaya_pdf && (
                                    <div>
                                        <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                            <FileText className="w-4 h-4 mr-1" />
                                            Rincian Biaya
                                        </h5>
                                        <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <FileText className="w-8 h-8 text-green-600 mr-3" />
                                            <div>
                                                <p className="font-medium text-green-800">Dokumen Rincian Biaya</p>
                                                <button
                                                    onClick={() => window.open(selectedLaporan.rincian_biaya_pdf, "_blank")}
                                                    className="text-sm text-green-600 hover:text-green-800 mt-1 cursor-pointer"
                                                >
                                                    Lihat Dokumen →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Deskripsi */}
                        <div className="mb-6">
                            <h4 className="font-medium text-gray-900 mb-2">
                                Deskripsi
                            </h4>
                            <p className="text-gray-600">
                                {selectedLaporan.deskripsi}
                            </p>
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
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                                            <div className="font-medium text-gray-900">
                                                {petugasDitugaskan.nama}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                <span className="font-medium">Telepon:</span> {petugasDitugaskan.nomor_telepon}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                <span className="font-medium">Alamat:</span> {petugasDitugaskan.alamat}
                                            </div>
                                            <div className="text-gray-500 text-xs mt-2">
                                                {petugasDitugaskan.pivot?.dikirim_pada 
                                                    ? `Ditugaskan: ${new Date(petugasDitugaskan.pivot.dikirim_pada).toLocaleDateString('id-ID')}`
                                                    : "Baru ditugaskan"}
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleReleasePetugas}
                                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 cursor-pointer"
                                        >
                                            Lepaskan
                                        </button>
                                    </div>
                                    
                                    {/* Info tambahan */}
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-xs text-gray-500">
                                            <span className="font-medium">Info:</span> Ubah status tugas sesuai progress petugas
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            💡 <span className="font-medium">Tips:</span> Ubah status laporan ke "Selesai" atau "Ditolak" untuk membuat petugas Tersedia kembali
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-gray-600 mb-3">
                                        Pilih petugas untuk menangani laporan ini:
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {getPetugasTersedia().map((petugas) => (
                                            <div
                                                key={petugas.id}
                                                className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                                                onClick={() => handleAssignPetugas(petugas.id)}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {petugas.nama}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {petugas.nomor_telepon}
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            {petugas.alamat}
                                                        </div>
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

                        {/* Upload Bukti Perbaikan */}
                        {isLaporanSelesai && (
                            <div className="border-t pt-6 mt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                        <Upload className="w-5 h-5 mr-2" />
                                        Upload Bukti Perbaikan
                                    </h3>
                                    <button
                                        onClick={handleOpenUploadModal}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 cursor-pointer flex items-center"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload Bukti
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex items-center mb-2">
                                            <ImageIcon className="w-5 h-5 text-green-600 mr-2" />
                                            <h4 className="font-medium text-green-900">
                                                Foto Bukti
                                            </h4>
                                        </div>
                                        <p className="text-sm text-green-700">
                                            {selectedLaporan.foto_bukti_perbaikan?.length > 0 
                                                ? `${selectedLaporan.foto_bukti_perbaikan.length} foto sudah diupload`
                                                : "Belum ada foto bukti"}
                                        </p>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center mb-2">
                                            <FileText className="w-5 h-5 text-blue-600 mr-2" />
                                            <h4 className="font-medium text-blue-900">
                                                Rincian Biaya
                                            </h4>
                                        </div>
                                        <p className="text-sm text-blue-700">
                                            {selectedLaporan.rincian_biaya_pdf 
                                                ? "Dokumen sudah diupload"
                                                : "Belum ada dokumen"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

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

            {showUploadModal && (
                <UploadBuktiModal
                    showUploadModal={showUploadModal}
                    setShowUploadModal={setShowUploadModal}
                    selectedLaporanForUpload={selectedLaporan}
                    showNotification={showNotification}
                    fetchLaporanData={fetchLaporanData}
                    onSuccess={handleUploadSuccess}
                />
            )}
        </>
    );
}