import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, UserCheck, UserX, X, AlertTriangle, MapPin, User, Check } from "lucide-react";
import PetugasModal from "../modals/PetugasModal";
import axios from "axios";

export default function DataPetugasPage({ showNotification }) {
    const [showPetugasModal, setShowPetugasModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showLaporanModal, setShowLaporanModal] = useState(false);
    
    const [modalConfig, setModalConfig] = useState({
        title: "",
        message: "",
        confirmText: "",
        type: "warning",
        onConfirm: () => {}
    });
    
    const [selectedPetugas, setSelectedPetugas] = useState(null);
    const [selectedLaporanId, setSelectedLaporanId] = useState(null);
    
    const [petugasData, setPetugasData] = useState([]);
    const [formPetugas, setFormPetugas] = useState({
        nama: "",
        alamat: "",
        nomor_telepon: "",
        status: "Aktif",
    });
    const [isEditingPetugas, setIsEditingPetugas] = useState(false);
    const [editingPetugasId, setEditingPetugasId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [laporanData, setLaporanData] = useState([]);

    // Cek apakah petugas sedang dalam tugas (dengan logika yang lebih akurat)
const isPetugasDalamTugas = (petugas) => {
    console.log('🔍 Checking petugas tugas:', {
        nama: petugas.nama,
        status_penugasan: petugas.status_penugasan,
        sedang_dalam_tugas: petugas.sedang_dalam_tugas,
        laporan_ditangani: petugas.laporan_ditangani,
        laporans_count: petugas.laporans?.length || 0
    });
    
    // 1. Gunakan flag dari backend jika ada
    if (petugas.sedang_dalam_tugas !== undefined) {
        console.log('✅ Using sedang_dalam_tugas flag:', petugas.sedang_dalam_tugas);
        return petugas.sedang_dalam_tugas;
    }
    
    // 2. Gunakan status_penugasan
    if (petugas.status_penugasan === 'Dalam Tugas') {
        console.log('✅ Using status_penugasan:', petugas.status_penugasan);
        return true;
    }
    
    // 3. Cek manual dari data laporans
    if (!petugas.laporans || !Array.isArray(petugas.laporans)) {
        console.log('❌ No laporans data');
        return false;
    }
    
    console.log('📋 Laporans data:', petugas.laporans.map(l => ({
        judul: l.judul,
        status: l.status,
        pivot: l.pivot
    })));
    
    const isDalamTugas = petugas.laporans.some(laporan => {
        const pivot = laporan.pivot;
        const isActive = pivot && 
               pivot.is_active === 1 && 
               ["Dikirim", "Diterima", "Dalam Pengerjaan"].includes(pivot.status_tugas);
        
        console.log(`📊 Laporan ${laporan.judul}: isActive=${isActive}, pivot=`, pivot);
        return isActive;
    });
    
    console.log(`🎯 Final result for ${petugas.nama}:`, isDalamTugas);
    return isDalamTugas;
};

    // Get status gabungan untuk badge (status akun + penugasan)
const getStatusGabungan = (petugas) => {
    // DEBUG
    console.log("🎯 Petugas:", petugas.nama, 
                "Status:", petugas.status, 
                "Status Penugasan:", petugas.status_penugasan,
                "Laporans:", petugas.laporans?.length || 0);

    // 1. Gunakan status_penugasan dari backend jika ada
    if (petugas.status_penugasan) {
        const statusMap = {
            'Tersedia': { text: 'Tersedia', color: 'bg-green-100 text-green-800' },
            'Dalam Tugas': { text: 'Dalam Tugas', color: 'bg-blue-100 text-blue-800' },
            'Nonaktif': { text: 'Nonaktif', color: 'bg-red-100 text-red-800' }
        };
        return statusMap[petugas.status_penugasan] || statusMap['Tersedia'];
    }

    // 2. Fallback ke logika lama (jika backend tidak mengirim status_penugasan)
    if (petugas.status === "Nonaktif") {
        return {
            text: "Nonaktif",
            color: "bg-red-100 text-red-800"
        };
    }

    // 3. Cek dari data laporans
    const hasActiveTask = petugas.laporans && petugas.laporans.some(laporan => {
        const pivot = laporan.pivot;
        return pivot && 
               pivot.is_active === 1 && 
               ["Dikirim", "Diterima", "Dalam Pengerjaan"].includes(pivot.status_tugas);
    });

    return {
        text: hasActiveTask ? "Dalam Tugas" : "Tersedia",
        color: hasActiveTask ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
    };
};

    // Get laporan yang sedang ditangani petugas (hanya yang belum selesai)
    const getLaporanDitangani = (petugas) => {
    console.log('🔍 Getting laporan ditangani for:', petugas.nama);
    
    if (!petugas.laporans || !Array.isArray(petugas.laporans)) {
        console.log('❌ No laporans array');
        return null;
    }
    
    // Cari laporan aktif dari data backend
    if (petugas.laporan_ditangani) {
        console.log('✅ Using laporan_ditangani from backend:', petugas.laporan_ditangani);
        return {
            id: petugas.laporan_ditangani.id,
            judul: petugas.laporan_ditangani.judul,
            status: petugas.laporan_ditangani.status,
            status_tugas: petugas.laporan_ditangani.status_tugas
        };
    }
    
    // Fallback: cari manual
    const laporanAktif = petugas.laporans.find(laporan => {
        const pivot = laporan.pivot;
        const statusTugas = pivot?.status_tugas;
        const statusLaporan = laporan.status;
        
        console.log('🔍 Checking laporan:', {
            judul: laporan.judul,
            status: statusLaporan,
            pivot: pivot
        });
        
        // Hanya laporan yang aktif dan belum selesai
        return pivot && 
               pivot.is_active === 1 &&
               ["Dikirim", "Diterima", "Dalam Pengerjaan"].includes(statusTugas) &&
               statusLaporan !== "Selesai" &&
               statusLaporan !== "Ditolak";
    });
    
    if (laporanAktif) {
        console.log('✅ Found active laporan:', {
            id: laporanAktif.id,
            judul: laporanAktif.judul
        });
    } else {
        console.log('❌ No active laporan found');
    }
    
    return laporanAktif || null;
};

    // Fetch data petugas
const fetchPetugasData = async () => {
    setIsLoading(true);
    try {
        const token = localStorage.getItem("admin_token");
        
        const response = await axios.get(
            "http://localhost:8000/api/admin/petugas",
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        
        if (response.data.success) {
            // DEBUG: Tampilkan detail setiap petugas
            response.data.data.forEach((petugas, index) => {
                console.log(`📊 Petugas ${index + 1}:`, {
                    nama: petugas.nama,
                    status_akun: petugas.status,
                    status_penugasan: petugas.status_penugasan,
                    laporans_count: petugas.laporans?.length || 0,
                    laporans: petugas.laporans?.map(l => ({
                        judul: l.judul,
                        status: l.status,
                        pivot: l.pivot
                    })) || []
                });
            });
            
            setPetugasData(response.data.data);
        }
    } catch (error) {
        console.error("Error fetching petugas:", error);
        showNotification("Gagal mengambil data petugas", "error");
    } finally {
        setIsLoading(false);
    }
};

    // Fetch data laporan
    const fetchLaporanData = async () => {
        try {
            const token = localStorage.getItem("admin_token");
            const response = await axios.get("http://localhost:8000/api/admin/laporan", {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setLaporanData(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching laporan:", error);
        }
    };

    useEffect(() => {
        fetchPetugasData();
        fetchLaporanData();
    }, []);

    // Fungsi tambahan: Auto-refresh data secara berkala
    useEffect(() => {
        const interval = setInterval(() => {
            fetchPetugasData();
            fetchLaporanData();
        }, 30000); // Refresh setiap 30 detik

        return () => clearInterval(interval);
    }, []);

    const handleEditPetugas = (petugas) => {
        setFormPetugas({
            nama: petugas.nama,
            alamat: petugas.alamat,
            nomor_telepon: petugas.nomor_telepon,
            status: petugas.status,
        });
        setIsEditingPetugas(true);
        setEditingPetugasId(petugas.id);
        setShowPetugasModal(true);
    };

    // Handle tombol Tugaskan
    const handleOpenTugaskan = (petugas) => {
        const laporanDitangani = getLaporanDitangani(petugas);
        
        if (laporanDitangani) {
            showNotification("Petugas sudah dalam tugas menangani laporan lain", "warning");
            return;
        }

        const laporanTersedia = laporanData.filter(l => 
            (l.status === "Tervalidasi" || l.status === "Validasi") 
        );
        
        if (laporanTersedia.length === 0) {
            showNotification("Tidak ada laporan yang tersedia untuk ditugaskan", "warning");
            return;
        }

        setSelectedPetugas(petugas);
        setSelectedLaporanId(null);
        setShowLaporanModal(true);
    };

    // Handle tombol Lepaskan
    const handleOpenLepaskan = (petugas) => {
        const laporanDitangani = getLaporanDitangani(petugas);
        
        if (!laporanDitangani) {
            showNotification("Petugas tidak sedang menangani laporan", "info");
            return;
        }

        setSelectedPetugas(petugas);
        setModalConfig({
            title: "Lepaskan Petugas",
            message: `Apakah Anda yakin ingin melepas "${petugas.nama}" dari tugas?`,
            confirmText: "Lepaskan",
            type: "warning",
            onConfirm: () => handleLepaskanPetugas(petugas)
        });
        setShowConfirmModal(true);
    };

    // Handle tombol Hapus
    const handleOpenHapus = (petugas) => {
        setSelectedPetugas(petugas);
        setModalConfig({
            title: "Hapus Petugas",
            message: `Apakah Anda yakin ingin menghapus petugas "${petugas.nama}"?`,
            confirmText: "Hapus",
            type: "danger",
            onConfirm: () => handleDeletePetugas(petugas.id)
        });
        setShowConfirmModal(true);
    };

    // Handle assign petugas ke laporan
    const handleAssignPetugas = async (laporanId) => {
        try {
            const token = localStorage.getItem("admin_token");
            const response = await axios.post(
                "http://localhost:8000/api/admin/petugas/assign-laporan",
                {
                    petugas_id: selectedPetugas.id,
                    catatan: "Ditugaskan oleh admin"
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                showNotification(`Petugas ${selectedPetugas.nama} berhasil ditugaskan ke laporan`, "success");
                fetchPetugasData();
                fetchLaporanData();
                setShowLaporanModal(false);
                setSelectedPetugas(null);
                setSelectedLaporanId(null);
            }
        } catch (error) {
            console.error("Error assigning petugas:", error);
            const errorMsg = error.response?.data?.message || "Gagal menugaskan petugas";
            showNotification(errorMsg, "error");
        }
    };

    // Handle lepaskan petugas
    const handleLepaskanPetugas = async (petugas) => {
        const laporanDitangani = getLaporanDitangani(petugas);
        
        try {
            const token = localStorage.getItem("admin_token");
            const response = await axios.post(
                "http://localhost:8000/api/admin/petugas/release-laporan",
                {
                    laporan_id: laporanDitangani.id,
                    petugas_id: petugas.id,
                    catatan: "Dilepas oleh admin"
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                showNotification(`Petugas ${petugas.nama} berhasil dilepas dari laporan`, "success");
                fetchPetugasData();
                fetchLaporanData();
            }
        } catch (error) {
            console.error("Error releasing petugas:", error);
            const errorMsg = error.response?.data?.message || "Gagal melepas petugas";
            showNotification(errorMsg, "error");
        }
    };

    // Handle delete petugas
    const handleDeletePetugas = async (petugasId) => {
        try {
            const token = localStorage.getItem("admin_token");
            const response = await axios.delete(
                `http://localhost:8000/api/admin/petugas/${petugasId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                showNotification("Petugas berhasil dihapus", "success");
                fetchPetugasData();
            }
        } catch (error) {
            console.error("Error deleting petugas:", error);
            const errorMessage = error.response?.data?.message || "Gagal menghapus petugas";
            showNotification(errorMessage, "error");
        }
    };

    const handleSubmitPetugas = async () => {
        try {
            const token = localStorage.getItem("admin_token");
            const url = isEditingPetugas
                ? `http://localhost:8000/api/admin/petugas/${editingPetugasId}`
                : "http://localhost:8000/api/admin/petugas";

            const method = isEditingPetugas ? "put" : "post";
            const response = await axios[method](url, formPetugas, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
            });

            if (response.data.success) {
                showNotification(
                    isEditingPetugas ? "Petugas berhasil diupdate" : "Petugas berhasil ditambahkan",
                    "success"
                );
                setShowPetugasModal(false);
                resetFormPetugas();
                fetchPetugasData();
            }
        } catch (error) {
            console.error("Error submitting petugas:", error);
            const errorMsg = error.response?.data?.message || "Gagal menyimpan data petugas";
            showNotification(errorMsg, "error");
        }
    };

    const resetFormPetugas = () => {
        setFormPetugas({ 
            nama: "", 
            alamat: "", 
            nomor_telepon: "", 
            status: "Aktif",
        });
        setIsEditingPetugas(false);
        setEditingPetugasId(null);
    };

    // Filter laporan yang tersedia
    const laporanTersedia = laporanData.filter(l => 
        (l.status === "Tervalidasi" || l.status === "Validasi") 
    );

    // Render loading
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Data Petugas</h1>
                    <p className="text-gray-600">Kelola petugas lapangan</p>
                </div>
                <button
                    onClick={() => setShowPetugasModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors flex items-center space-x-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Petugas</span>
                </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NAMA</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ALAMAT</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NOMOR TELEPON</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STATUS</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AKSI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {petugasData.map((petugas) => {
                                const statusGabungan = getStatusGabungan(petugas);
                                const dalamTugas = isPetugasDalamTugas(petugas);
                                
                                return (
                                    <tr key={petugas.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{petugas.nama}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{petugas.alamat}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{petugas.nomor_telepon}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusGabungan.color}`}>
                                                {statusGabungan.text}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditPetugas(petugas)}
                                                    className="text-blue-600 hover:text-blue-900 text-sm font-medium cursor-pointer flex items-center"
                                                >
                                                    <Edit className="w-4 h-4 mr-1" />
                                                    Edit
                                                </button>
                                                
                                                {petugas.status === "Aktif" && (
                                                    <>
                                                        {!dalamTugas ? (
                                                            <button
                                                                onClick={() => handleOpenTugaskan(petugas)}
                                                                className="text-green-600 hover:text-green-900 text-sm font-medium cursor-pointer flex items-center"
                                                                title="Tugaskan petugas"
                                                            >
                                                                <UserCheck className="w-4 h-4 mr-1" />
                                                                Tugaskan
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleOpenLepaskan(petugas)}
                                                                className="text-orange-600 hover:text-orange-900 text-sm font-medium cursor-pointer flex items-center"
                                                                title="Lepaskan dari tugas"
                                                            >
                                                                <UserX className="w-4 h-4 mr-1" />
                                                                Lepaskan
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                
                                                <button
                                                    onClick={() => handleOpenHapus(petugas)}
                                                    className="text-red-600 hover:text-red-900 text-sm font-medium cursor-pointer flex items-center"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-1" />
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Konfirmasi (untuk Lepaskan dan Hapus) */}
            {showConfirmModal && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">{modalConfig.title}</h3>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="px-6 py-6">
                            <div className="flex items-start">
                                <AlertTriangle className={`w-6 h-6 mr-3 mt-1 ${
                                    modalConfig.type === "danger" 
                                        ? "text-red-500" 
                                        : "text-yellow-500"
                                }`} />
                                <p className="text-gray-700">{modalConfig.message}</p>
                            </div>
                        </div>
                        
                        <div className="px-6 py-4 border-t flex justify-end space-x-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium cursor-pointer hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => {
                                    modalConfig.onConfirm();
                                    setShowConfirmModal(false);
                                }}
                                className={`px-4 py-2 rounded-lg font-medium cursor-pointer ${
                                    modalConfig.type === "danger" 
                                        ? "bg-red-600 hover:bg-red-700 text-white" 
                                        : "bg-yellow-600 hover:bg-yellow-700 text-white"
                                }`}
                            >
                                {modalConfig.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Pilih Laporan (untuk Tugaskan) */}
            {showLaporanModal && selectedPetugas && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl shadow-lg max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Pilih Laporan untuk Ditugaskan</h3>
                                <p className="text-sm text-gray-600">
                                    Tugaskan ke: <span className="font-medium">{selectedPetugas.nama}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowLaporanModal(false);
                                    setSelectedLaporanId(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            {laporanTersedia.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">Tidak ada laporan yang tersedia untuk ditugaskan</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {laporanTersedia.map((laporan) => (
                                        <div
                                            key={laporan.id}
                                            onClick={() => setSelectedLaporanId(laporan.id)}
                                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                                selectedLaporanId === laporan.id 
                                                    ? "border-blue-500 bg-blue-50" 
                                                    : "border-gray-200 hover:bg-gray-50"
                                            }`}
                                        >
                                            <div className="flex items-start">
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 mt-1 ${
                                                    selectedLaporanId === laporan.id 
                                                        ? "border-blue-500 bg-blue-500" 
                                                        : "border-gray-300"
                                                }`}>
                                                    {selectedLaporanId === laporan.id && (
                                                        <Check className="w-3 h-3 text-white" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900">{laporan.judul}</h4>
                                                    <div className="mt-2 space-y-1">
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <MapPin className="w-4 h-4 mr-2" />
                                                            <span>{laporan.lokasi}</span>
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <User className="w-4 h-4 mr-2" />
                                                            <span>Pelapor: {laporan.pelapor_nama}</span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            laporan.status === "Tervalidasi" 
                                                                ? "bg-green-100 text-green-800" 
                                                                : "bg-yellow-100 text-yellow-800"
                                                        }`}>
                                                            {laporan.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="px-6 py-4 border-t flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowLaporanModal(false);
                                    setSelectedLaporanId(null);
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium cursor-pointer hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => selectedLaporanId && handleAssignPetugas(selectedLaporanId)}
                                disabled={!selectedLaporanId}
                                className={`px-4 py-2 rounded-lg font-medium cursor-pointer ${
                                    !selectedLaporanId
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                }`}
                            >
                                Tugaskan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <PetugasModal
                showPetugasModal={showPetugasModal}
                setShowPetugasModal={setShowPetugasModal}
                formPetugas={formPetugas}
                setFormPetugas={setFormPetugas}
                isEditingPetugas={isEditingPetugas}
                handleSubmitPetugas={handleSubmitPetugas}
                resetFormPetugas={resetFormPetugas}
            />
        </div>
    );
}