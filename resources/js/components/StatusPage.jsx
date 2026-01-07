import React, { useState, useEffect } from "react";
import {
    Search,
    Clock,
    CheckCircle,
    XCircle,
    UserCheck,
    Wrench,
    Camera,
    FileText,
    MapPin,
    Calendar,
    Download,
    Eye,
    ArrowUpDown,
    X,
    Users,
    User,
    Phone,
    MapPin as MapIcon,
    AlertCircle,
    Info,
    Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const StatusPage = () => {
    const [laporanData, setLaporanData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("Semua status");
    const [sortBy, setSortBy] = useState("terbaru");
    const [selectedLaporan, setSelectedLaporan] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [petugasLaporan, setPetugasLaporan] = useState([]);
    const [isLoadingPetugas, setIsLoadingPetugas] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    // 🔥 PERBAIKAN: Tracking steps yang disederhanakan untuk laporan ditolak
    const trackingSteps = [
        {
            id: 1,
            status: "Validasi",
            title: "Laporan Terkirim",
            description: "Laporan Anda telah berhasil dikirim",
            icon: Send,
            color: "text-blue-500",
            bgColor: "bg-blue-50",
        },
        {
            id: 2,
            status: "Ditolak",
            title: "Laporan Ditolak",
            description: "Laporan tidak dapat diproses",
            icon: XCircle,
            color: "text-red-500",
            bgColor: "bg-red-50",
        },
    ];

    // Tracking steps untuk status lainnya (selain ditolak)
    const trackingStepsLengkap = [
        {
            id: 1,
            status: "Validasi",
            title: "Laporan Terkirim",
            description: "Menunggu validasi oleh admin",
            icon: Clock,
            color: "text-yellow-500",
            bgColor: "bg-yellow-50",
        },
        {
            id: 2,
            status: "Tervalidasi",
            title: "Laporan Divalidasi!",
            description: "Admin akan segera mengirim petugas untuk menangani",
            icon: UserCheck,
            color: "text-blue-500",
            bgColor: "bg-blue-50",
        },
        {
            id: 3,
            status: "Dalam Proses",
            title: "Petugas Dikerahkan",
            description: "Dalam proses perbaikan fasilitas",
            icon: Wrench,
            color: "text-orange-500",
            bgColor: "bg-orange-50",
        },
        {
            id: 4,
            status: "Selesai",
            title: "Fasilitas Diperbaiki!",
            description: "Fasilitas sudah selesai diperbaiki",
            icon: CheckCircle,
            color: "text-green-500",
            bgColor: "bg-green-50",
        },
    ];

    // Function untuk mendapatkan token dari berbagai sumber
    const getToken = () => {
        const localStorageToken = localStorage.getItem('auth_token');
        if (localStorageToken) return localStorageToken;
        
        const sessionStorageToken = sessionStorage.getItem('auth_token');
        if (sessionStorageToken) return sessionStorageToken;
        
        if (user?.token) return user.token;
        
        return null;
    };

    // Function untuk mendapatkan headers dengan token
    const getAuthHeaders = () => {
        const token = getToken();
        if (!token) return null;
        
        return {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json"
        };
    };

       const downloadFile = async (url, fileName) => {
    if (!url || !url.startsWith('http')) {
        alert("URL file tidak valid");
        return;
    }

    console.log("📥 Downloading:", { url, fileName });

    try {
        // ✅ Gunakan fetch untuk ambil blob
        const response = await fetch(url, {
            method: 'GET',
            // ❌ JANGAN KIRIM HEADER AUTH — Cloudinary tidak butuh
        });

        if (!response.ok) {
            throw new Error(`Download failed: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(link);

        console.log("✅ Download berhasil:", fileName);

    } catch (error) {
        console.error("❌ Download gagal:", error);
        
        // 🔁 Fallback: jika fetch gagal, coba buka di tab baru
        alert(`Gagal download via fetch. Coba buka manual: ${url}`);
        window.open(url, '_blank');
    }
};

    // Fetch data laporan user
    const fetchLaporanUser = async () => {
        if (!user) {
            console.warn("User tidak ditemukan, redirect ke login");
            navigate('/LoginPage');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const headers = getAuthHeaders();
            
            if (!headers) {
                setError("Token tidak ditemukan. Silakan login kembali.");
                setIsLoading(false);
                return;
            }

            const response = await axios.get(
                "http://localhost:8000/api/laporan-user",
                {
                    headers: headers,
                    timeout: 10000
                }
            );

            console.log("🔄 Response API laporan-user:", response.data);

            if (response.data && (response.data.data || response.data)) {
                const data = response.data.data || response.data;
                
                // Debug data
                if (data.length > 0) {
                    console.log("📋 Laporan dengan alasan penolakan:");
                    data.forEach(laporan => {
                        if (laporan.status === "Ditolak" && laporan.alasan_penolakan) {
                            console.log({
                                id: laporan.id,
                                judul: laporan.judul,
                                alasan_penolakan: laporan.alasan_penolakan,
                                status: laporan.status
                            });
                        }
                    });
                }
                
                setLaporanData(data);
                setFilteredData(data);
            } else {
                setError("Format data tidak sesuai dari server.");
                setLaporanData([]);
                setFilteredData([]);
            }
        } catch (error) {
            console.error("Error fetching user laporan:", error);
            
            if (error.code === 'ECONNABORTED') {
                setError("Koneksi timeout. Silakan coba lagi.");
            } else if (error.response) {
                const status = error.response.status;
                
                if (status === 401) {
                    setError("Sesi Anda telah berakhir. Silakan login kembali.");
                    setTimeout(() => {
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('user');
                        localStorage.removeItem('remember_me');
                        sessionStorage.removeItem('auth_token');
                        sessionStorage.removeItem('user');
                        navigate('/LoginPage');
                    }, 2000);
                } else if (status === 403) {
                    setError("Anda tidak memiliki akses ke halaman ini.");
                } else if (status === 404) {
                    setError("Endpoint tidak ditemukan. Silakan hubungi administrator.");
                } else if (status === 500) {
                    setError("Terjadi kesalahan server. Silakan coba lagi nanti.");
                } else {
                    setError(`Error ${status}: ${error.response.data?.message || 'Terjadi kesalahan'}`);
                }
            } else if (error.request) {
                setError("Tidak ada response dari server. Periksa koneksi internet Anda.");
            } else {
                setError(`Terjadi kesalahan: ${error.message}`);
            }
            
            setLaporanData([]);
            setFilteredData([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch data petugas
    const fetchPetugasLaporan = async (laporanId) => {
        if (!laporanId) return;

        setIsLoadingPetugas(true);
        try {
            const headers = getAuthHeaders();
            
            if (!headers) {
                console.warn("Token tidak ditemukan untuk fetch petugas");
                setPetugasLaporan([]);
                setIsLoadingPetugas(false);
                return;
            }

            const response = await axios.get(
                `http://localhost:8000/api/laporan/${laporanId}/petugas`,
                {
                    headers: headers,
                    timeout: 10000
                }
            );

            if (response.data && response.data.success) {
                setPetugasLaporan(response.data.data || []);
            } else {
                setPetugasLaporan([]);
            }
        } catch (error) {
            console.error("Error fetching petugas laporan:", error);
            setPetugasLaporan([]);
        } finally {
            setIsLoadingPetugas(false);
        }
    };

    // Handle detail click
    const handleDetailClick = async (laporan) => {
        setSelectedLaporan(laporan);
        setShowDetailModal(true);
        
        // Hanya fetch petugas jika status bukan "Ditolak"
        if (laporan.status !== "Ditolak") {
            await fetchPetugasLaporan(laporan.id);
        }
    };

    // Filter dan search data
    useEffect(() => {
        let result = [...laporanData];

        if (statusFilter !== "Semua status") {
            result = result.filter((laporan) => {
                const status = laporan.status?.toLowerCase();
                const filter = statusFilter.toLowerCase();

                if (filter === "menunggu") return status === "validasi";
                if (filter === "dalam proses") return status === "dalam proses";
                if (filter === "selesai") return status === "selesai";
                if (filter === "ditolak") return status === "ditolak";

                return status === filter;
            });
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                (laporan) =>
                    laporan.judul?.toLowerCase().includes(term) ||
                    laporan.lokasi?.toLowerCase().includes(term) ||
                    laporan.deskripsi?.toLowerCase().includes(term) ||
                    (laporan.alasan_penolakan && laporan.alasan_penolakan.toLowerCase().includes(term))
            );
        }

        result.sort((a, b) => {
            const dateA = new Date(a.created_at || a.tanggal);
            const dateB = new Date(b.created_at || b.tanggal);

            if (sortBy === "terbaru") {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });

        setFilteredData(result);
    }, [laporanData, searchTerm, statusFilter, sortBy]);

    // Load data saat component mount
    useEffect(() => {
        fetchLaporanUser();
    }, [user]);

    // Retry function
    const handleRetry = () => {
        fetchLaporanUser();
    };

    // Stats calculation
    const stats = {
        total: laporanData.length,
        menunggu: laporanData.filter((l) => l.status === "Validasi").length,
        dalamProses: laporanData.filter((l) => l.status === "Dalam Proses")
            .length,
        selesai: laporanData.filter((l) => l.status === "Selesai").length,
        ditolak: laporanData.filter((l) => l.status === "Ditolak").length,
    };

    // Get current step based on status
    const getCurrentStep = (status) => {
        const statusLower = status?.toLowerCase();

        if (statusLower === "validasi") return 1;
        if (statusLower === "tervalidasi") return 2;
        if (statusLower === "dalam proses") return 3;
        if (statusLower === "selesai") return 4;
        if (statusLower === "ditolak") return 2; // 🔥 PERBAIKAN: Untuk ditolak, step 2

        return 1;
    };

    const getStatusText = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === "validasi") return "Menunggu Validasi";
        if (statusLower === "tervalidasi") return "Tervalidasi";
        if (statusLower === "dalam proses") return "Dalam Proses";
        if (statusLower === "selesai") return "Selesai";
        if (statusLower === "ditolak") return "Ditolak";
        return status;
    };

    const getStatusColor = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === "validasi") return "bg-yellow-100 text-yellow-800";
        if (statusLower === "tervalidasi") return "bg-blue-100 text-blue-800";
        if (statusLower === "dalam proses")
            return "bg-orange-100 text-orange-800";
        if (statusLower === "selesai") return "bg-green-100 text-green-800";
        if (statusLower === "ditolak") return "bg-red-100 text-red-800";
        return "bg-gray-100 text-gray-800";
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    // Format datetime untuk info petugas
    const formatDateTime = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // 🔥 TAMBAH: Function untuk menentukan tracking steps berdasarkan status
    const getTrackingSteps = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === "ditolak") {
            return trackingSteps; // Hanya 2 steps untuk ditolak
        }
        return trackingStepsLengkap; // Full steps untuk status lain
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header & Stats */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Laporan Saya
                    </h1>
                    <p className="text-gray-600">
                        Pantau progress laporan yang telah Anda kirim
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {stats.total}
                            </div>
                            <div className="text-sm text-blue-800">
                                Total Laporan
                            </div>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                                {stats.menunggu}
                            </div>
                            <div className="text-sm text-yellow-800">
                                Menunggu
                            </div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">
                                {stats.dalamProses}
                            </div>
                            <div className="text-sm text-orange-800">
                                Dalam Proses
                            </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {stats.selesai}
                            </div>
                            <div className="text-sm text-green-800">
                                Selesai
                            </div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">
                                {stats.ditolak}
                            </div>
                            <div className="text-sm text-red-800">Ditolak</div>
                        </div>
                    </div>
                </div>

                {/* Filter & Search */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    type="text"
                                    placeholder="Cari laporan Anda (judul, lokasi, deskripsi, atau alasan penolakan)..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="pl-10 w-full"
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-48">
                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value)
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                <option>Semua status</option>
                                <option>Menunggu</option>
                                <option>Dalam Proses</option>
                                <option>Selesai</option>
                                <option>Ditolak</option>
                            </select>
                        </div>
                        <div className="w-full md:w-48">
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm appearance-none"
                                >
                                    <option value="terbaru">Terbaru</option>
                                    <option value="terlama">Terlama</option>
                                </select>
                                <ArrowUpDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                        <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-red-700">{error}</p>
                                <div className="flex gap-3 mt-3">
                                    <Button
                                        onClick={handleRetry}
                                        className="bg-red-600 hover:bg-red-700 text-white cursor-pointer text-sm"
                                    >
                                        Coba Lagi
                                    </Button>
                                    <Button
                                        onClick={() => navigate('/LoginPage')}
                                        variant="outline"
                                        className="cursor-pointer text-sm"
                                    >
                                        Login Ulang
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && !error && (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Memuat data laporan...</p>
                    </div>
                )}

                {/* Laporan List */}
                {!isLoading && !error && (
                    <div className="space-y-4">
                        {filteredData.length > 0 ? (
                            filteredData.map((laporan) => (
                                <div
                                    key={laporan.id}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {laporan.judul}
                                                    </h3>
                                                    
                                                    <div className="flex items-center mt-1 space-x-2">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(laporan.status)}`}>
                                                            {getStatusText(laporan.status)}
                                                        </span>
                                                        
                                                        {/* Indicator untuk laporan selesai dengan bukti */}
                                                        {laporan.status === "Selesai" && (
                                                            <>
                                                                {laporan.foto_bukti_perbaikan?.length > 0 && (
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                        <Camera className="w-3 h-3 mr-1" />
                                                                        {laporan.foto_bukti_perbaikan.length} foto bukti
                                                                    </span>
                                                                )}
                                                                
                                                                {laporan.rincian_biaya_pdf && (
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                        <FileText className="w-3 h-3 mr-1" />
                                                                        PDF tersedia
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}

                                                        {/* Indicator untuk laporan ditolak */}
                                                        {laporan.status === "Ditolak" && laporan.alasan_penolakan && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                                Ada alasan penolakan
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Preview alasan penolakan di card (jika ada) */}
                                                    {laporan.status === "Ditolak" && laporan.alasan_penolakan && (
                                                        <div className="mt-2 bg-red-50 border border-red-100 rounded-lg p-3">
                                                            <div className="flex items-center">
                                                                <XCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                                                                <p className="text-sm text-red-700 line-clamp-2">
                                                                    <span className="font-medium">Alasan:</span> {laporan.alasan_penolakan}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                                                <div className="flex items-center">
                                                    <MapPin className="w-4 h-4 mr-2" />
                                                    <span>
                                                        {laporan.lokasi}
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    <span>
                                                        {formatDate(
                                                            laporan.created_at ||
                                                                laporan.tanggal
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    <span>
                                                        ID: {laporan.id}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-gray-700 text-sm line-clamp-2">
                                                {laporan.deskripsi}
                                            </p>
                                        </div>

                                        <div className="mt-4 md:mt-0 md:ml-6 flex space-x-2">
                                            <Button
                                                onClick={() =>
                                                    handleDetailClick(laporan)
                                                }
                                                className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                Detail
                                            </Button>

                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Tidak ada laporan
                                </h3>
                                <p className="text-gray-600">
                                    {searchTerm ||
                                    statusFilter !== "Semua status"
                                        ? "Tidak ada laporan yang sesuai dengan filter"
                                        : "Belum ada laporan yang dikirim"}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedLaporan && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="border-b border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Detail Laporan
                                </h2>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* 🔥 PERBAIKAN: Tracking Progress - Sederhana untuk laporan ditolak */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    {selectedLaporan.status === "Ditolak" ? "Status Laporan" : "Progres Laporan"}
                                </h3>
                                
                                {selectedLaporan.status === "Ditolak" ? (
                                    // 🔥 TAMPILAN SEDERHANA UNTUK LAPORAN DITOLAK
                                    <div className="space-y-6">
                                        {/* Step 1: Laporan Terkirim */}
                                        <div className="flex items-start space-x-4">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                                <Send className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-green-600">
                                                    Laporan Terkirim
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Laporan Anda telah berhasil dikirim ke sistem
                                                </p>
                                            </div>
                                        </div>

                                        {/* Step 2: Laporan Ditolak dengan alasan */}
                                        <div className="flex items-start space-x-4">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center border-2 border-red-500">
                                                <XCircle className="w-5 h-5 text-red-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-red-600">
                                                    Laporan Ditolak
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Laporan tidak dapat diproses
                                                </p>
                                                
                                                {/* 🔥 ALASAN PENOLAKAN */}
                                                {selectedLaporan.alasan_penolakan && (
                                                    <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-4">
                                                        <div className="flex items-center mb-2">
                                                            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                                                            <h4 className="text-sm font-medium text-red-900">
                                                                Alasan Penolakan
                                                            </h4>
                                                        </div>
                                                        <p className="text-sm text-red-700">
                                                            {selectedLaporan.alasan_penolakan}
                                                        </p>
                                                        <div className="mt-3 pt-3 border-t border-red-200">
                                                            <p className="text-xs text-red-600">
                                                                <span className="font-medium">Saran:</span> Anda dapat mengirim laporan baru dengan informasi yang lebih lengkap.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // 🔥 TAMPILAN FULL UNTUK STATUS LAINNYA
                                    <div className="space-y-4">
                                        {getTrackingSteps(selectedLaporan.status).map((step, index) => {
                                            const currentStep = getCurrentStep(selectedLaporan.status);
                                            const isCompleted = step.id < currentStep;
                                            const isCurrent = step.id === currentStep;
                                            const isFuture = step.id > currentStep;

                                            return (
                                                <div
                                                    key={step.id}
                                                    className="flex items-start space-x-4"
                                                >
                                                    <div
                                                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                                            isCompleted
                                                                ? "bg-green-500"
                                                                : isCurrent
                                                                ? step.bgColor
                                                                : "bg-gray-200"
                                                        }`}
                                                    >
                                                        <step.icon
                                                            className={`w-5 h-5 ${
                                                                isCompleted
                                                                    ? "text-white"
                                                                    : isCurrent
                                                                    ? step.color
                                                                    : "text-gray-400"
                                                            }`}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p
                                                            className={`font-medium ${
                                                                isCompleted
                                                                    ? "text-green-600"
                                                                    : isCurrent
                                                                    ? "text-gray-900"
                                                                    : "text-gray-500"
                                                            }`}
                                                        >
                                                            {step.title}
                                                        </p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {step.description}
                                                        </p>

                                                        {/* Tampilkan info petugas di step 3 (Dalam Proses) */}
                                                        {isCurrent &&
                                                            step.id === 3 && (
                                                                <div className="mt-3">
                                                                    {isLoadingPetugas ? (
                                                                        <div className="flex items-center text-sm text-gray-500">
                                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                                                            Memuat
                                                                            data
                                                                            petugas...
                                                                        </div>
                                                                    ) : petugasLaporan.length >
                                                                      0 ? (
                                                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                                            <p className="text-sm font-medium text-blue-900 mb-2">
                                                                                Petugas
                                                                                yang
                                                                                Dikerahkan:
                                                                            </p>
                                                                            {petugasLaporan.map(
                                                                                (
                                                                                    petugas
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            petugas.id
                                                                                        }
                                                                                        className="flex items-start space-x-3 mb-2 last:mb-0"
                                                                                    >
                                                                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                                            <User className="w-4 h-4 text-blue-600" />
                                                                                        </div>
                                                                                        <div className="flex-1">
                                                                                            <p className="text-sm font-medium text-blue-800">
                                                                                                {
                                                                                                    petugas.nama
                                                                                                }
                                                                                            </p>
                                                                                            <div className="flex items-center text-xs text-blue-700 mt-1">
                                                                                                <Phone className="w-3 h-3 mr-1" />
                                                                                                <span>
                                                                                                    {
                                                                                                        petugas.nomor_telepon
                                                                                                    }
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="flex items-center text-xs text-blue-600 mt-1">
                                                                                                <MapIcon className="w-3 h-3 mr-1" />
                                                                                                <span>
                                                                                                    {
                                                                                                        petugas.alamat
                                                                                                    }
                                                                                                </span>
                                                                                            </div>
                                                                                            {petugas
                                                                                                .pivot
                                                                                                ?.dikirim_pada && (
                                                                                                <p className="text-xs text-blue-500 mt-1">
                                                                                                    Dikirim:{" "}
                                                                                                    {formatDateTime(
                                                                                                        petugas
                                                                                                            .pivot
                                                                                                            .dikirim_pada
                                                                                                    )}
                                                                                                </p>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                                            <p className="text-sm text-yellow-800">
                                                                                Menunggu
                                                                                penugasan
                                                                                petugas...
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Informasi Laporan */}
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Informasi Laporan
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="font-medium text-gray-500">
                                            Judul Laporan
                                        </p>
                                        <p className="text-gray-900">
                                            {selectedLaporan.judul}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-500">
                                            Lokasi
                                        </p>
                                        <p className="text-gray-900">
                                            {selectedLaporan.lokasi}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-500">
                                            Tanggal Lapor
                                        </p>
                                        <p className="text-gray-900">
                                            {formatDate(
                                                selectedLaporan.created_at ||
                                                    selectedLaporan.tanggal
                                            )}
                                        </p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="font-medium text-gray-500">
                                            Deskripsi
                                        </p>
                                        <p className="text-gray-900 mt-1">
                                            {selectedLaporan.deskripsi}
                                        </p>
                                    </div>

                                    {/* Tampilkan alasan penolakan di bagian informasi */}
                                    {selectedLaporan.status === "Ditolak" && selectedLaporan.alasan_penolakan && (
                                        <div className="md:col-span-2">
                                            <p className="font-medium text-gray-500">
                                                Alasan Penolakan
                                            </p>
                                            <div className="mt-1 bg-red-50 border border-red-200 rounded-lg p-4">
                                                <p className="text-red-700">
                                                    {selectedLaporan.alasan_penolakan}
                                                </p>
                                                <p className="text-xs text-red-600 mt-2">
                                                    <span className="font-medium">Catatan:</span> Laporan ini tidak dapat diproses lebih lanjut. Silakan kirim laporan baru dengan informasi yang lebih lengkap.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Foto Laporan */}
                            {selectedLaporan.foto_laporan && (
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Foto Laporan
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {selectedLaporan.foto_laporan.map(
                                            (foto, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={foto}
                                                        alt={`Foto laporan ${
                                                            index + 1
                                                        }`}
                                                        className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                                                        onClick={() =>
                                                            window.open(
                                                                foto,
                                                                "_blank"
                                                            )
                                                        }
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.innerHTML = 
                                                                '<div class="w-full h-24 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">' +
                                                                '<p class="text-gray-500 text-xs">Gambar tidak ditemukan</p>' +
                                                                '</div>';
                                                        }}
                                                    />
                                                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                                        Foto {index + 1}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 🔥 BUKTI PERBAIKAN DARI ADMIN (Hanya untuk status Selesai) */}
                            {selectedLaporan.status === "Selesai" && (
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                                        Bukti Perbaikan dari Petugas
                                    </h3>
                                    
                                    {/* Foto Bukti Perbaikan */}
                                    {selectedLaporan.foto_bukti_perbaikan &&
                                        selectedLaporan.foto_bukti_perbaikan.length > 0 && (
                                        <div className="mb-6">
                                            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                                                <Camera className="w-4 h-4 mr-2" />
                                                Foto Hasil Perbaikan
                                                <span className="ml-2 text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                                    {selectedLaporan.foto_bukti_perbaikan.length} foto
                                                </span>
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {selectedLaporan.foto_bukti_perbaikan.map((foto, index) => {
                                                    if (!foto || typeof foto !== 'string') return null;
                                                    
                                                    return (
                                                        <div key={index} className="relative group">
                                                            <img
                                                                src={foto}
                                                                alt={`Bukti perbaikan ${index + 1}`}
                                                                className="w-full h-32 object-cover rounded-lg border border-green-200 cursor-pointer hover:opacity-80"
                                                                onClick={() => window.open(foto, "_blank")}
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.parentElement.innerHTML = 
                                                                        '<div class="w-full h-32 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">' +
                                                                        '<p class="text-red-600 text-xs">Gambar tidak ditemukan</p>' +
                                                                        '</div>';
                                                                }}
                                                            />
                                                            <div className="absolute bottom-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                                                                Bukti {index + 1}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-2">
                                                Foto dokumentasi hasil perbaikan fasilitas oleh petugas
                                            </p>
                                        </div>
                                    )}

                                    {/* Rincian Biaya PDF */}
                                    {selectedLaporan.rincian_biaya_pdf && (
                                        <div>
                                            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                                                <FileText className="w-4 h-4 mr-2" />
                                                Rincian Biaya Perbaikan
                                            </h4>
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                                <div className="flex items-center">
                                                    <FileText className="w-8 h-8 text-green-600 mr-3" />
                                                    <div className="flex-1">
                                                        <p className="text-green-800 font-medium">Dokumen Rincian Biaya</p>
                                                        <p className="text-sm text-green-600 mt-1">
                                                            Dokumen PDF berisi rincian biaya perbaikan fasilitas
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <Button
                                                onClick={() => {
                                                    downloadFile(
                                                        selectedLaporan.rincian_biaya_pdf, 
                                                        `rincian-biaya-${selectedLaporan.id}.pdf`
                                                    );
                                                }}
                                                className="bg-green-600 hover:bg-green-700 text-white cursor-pointer w-full"
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Download Rincian Biaya (PDF)
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 🔥 TAMBAH: Action untuk laporan ditolak */}
                            {selectedLaporan.status === "Ditolak" && (
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                                        Apa yang harus dilakukan?
                                    </h3>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-800 mb-3">
                                            Jika laporan Anda ditolak, Anda dapat:
                                        </p>
                                        <ul className="space-y-2 text-sm text-blue-700">
                                            <li className="flex items-start">
                                                <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                                <span>Periksa alasan penolakan di atas</span>
                                            </li>
                                            <li className="flex items-start">
                                                <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                                <span>Perbaiki informasi yang kurang lengkap</span>
                                            </li>
                                            <li className="flex items-start">
                                                <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                                <span>Kirim laporan baru dengan foto yang lebih jelas</span>
                                            </li>
                                            <li className="flex items-start">
                                                <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                                <span>Pastikan lokasi yang dilaporkan spesifik</span>
                                            </li>
                                        </ul>
                                        <div className="mt-4 pt-4 border-t border-blue-200">
                                            <Button
                                                onClick={() => {
                                                    setShowDetailModal(false);
                                                    navigate('/LaporPage');
                                                }}
                                                className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer w-full"
                                            >
                                                Kirim Laporan Baru
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatusPage;