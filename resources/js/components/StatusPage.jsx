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

    const trackingSteps = [
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
        {
            id: 5,
            status: "Ditolak",
            title: "Laporan Ditolak",
            description: "Laporan tidak dapat diproses",
            icon: XCircle,
            color: "text-red-500",
            bgColor: "bg-red-50",
        },
    ];

    // Function untuk mendapatkan token dari berbagai sumber
    const getToken = () => {
        // Cek localStorage dulu (untuk remember me)
        const localStorageToken = localStorage.getItem('auth_token');
        if (localStorageToken) return localStorageToken;
        
        // Cek sessionStorage
        const sessionStorageToken = sessionStorage.getItem('auth_token');
        if (sessionStorageToken) return sessionStorageToken;
        
        // Cek dari user context
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

    // Fetch data laporan user
    const fetchLaporanUser = async () => {
        if (!user) {
            console.warn("User tidak ditemukan, redirect ke login");
            navigate('/login');
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
                    timeout: 10000 // 10 second timeout
                }
            );

            console.log("Response API laporan-user:", response.data);

            if (response.data && (response.data.data || response.data)) {
                const data = response.data.data || response.data;
                setLaporanData(data);
                setFilteredData(data);
            } else {
                setError("Format data tidak sesuai dari server.");
                setLaporanData([]);
                setFilteredData([]);
            }
        } catch (error) {
            console.error("Error fetching user laporan:", error);
            
            // Handle berbagai jenis error
            if (error.code === 'ECONNABORTED') {
                setError("Koneksi timeout. Silakan coba lagi.");
            } else if (error.response) {
                // Server responded with error status
                const status = error.response.status;
                
                if (status === 401) {
                    setError("Sesi Anda telah berakhir. Silakan login kembali.");
                    // Clear token dan redirect ke login setelah 2 detik
                    setTimeout(() => {
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('user');
                        localStorage.removeItem('remember_me');
                        sessionStorage.removeItem('auth_token');
                        sessionStorage.removeItem('user');
                        navigate('/login');
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
                // Request dibuat tapi tidak ada response
                setError("Tidak ada response dari server. Periksa koneksi internet Anda.");
            } else {
                // Error lainnya
                setError(`Terjadi kesalahan: ${error.message}`);
            }
            
            setLaporanData([]);
            setFilteredData([]);
        } finally {
            setIsLoading(false);
        }
    };

    // 🔥 NEW: Fetch data petugas untuk laporan tertentu
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

            console.log("Response petugas:", response.data);

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

    // Handle detail click - tambah fetch petugas
    const handleDetailClick = async (laporan) => {
        setSelectedLaporan(laporan);
        setShowDetailModal(true);
        // Fetch data petugas saat modal dibuka
        await fetchPetugasLaporan(laporan.id);
    };

    // Filter dan search data
    useEffect(() => {
        let result = [...laporanData];

        // Filter by status
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

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                (laporan) =>
                    laporan.judul?.toLowerCase().includes(term) ||
                    laporan.lokasi?.toLowerCase().includes(term) ||
                    laporan.deskripsi?.toLowerCase().includes(term)
            );
        }

        // Sort data
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
        if (statusLower === "ditolak") return 5;

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
                                    placeholder="Cari laporan Anda..."
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
                                        onClick={() => navigate('/login')}
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
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                                >
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {laporan.judul}
                                                </h3>
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                        laporan.status
                                                    )}`}
                                                >
                                                    {getStatusText(
                                                        laporan.status
                                                    )}
                                                </span>
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
                            {/* Tracking Progress */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Status Laporan
                                </h3>
                                <div className="space-y-4">
                                    {trackingSteps.map((step, index) => {
                                        const currentStep = getCurrentStep(
                                            selectedLaporan.status
                                        );
                                        const isCompleted =
                                            step.id < currentStep;
                                        const isCurrent =
                                            step.id === currentStep;
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

                                                    {/* Additional info untuk step lainnya */}
                                                    {isCurrent &&
                                                        step.id === 4 && (
                                                            <div className="mt-3 space-y-2">
                                                                <Button className="bg-green-600 hover:bg-green-700 text-white cursor-pointer text-sm">
                                                                    <Camera className="w-4 h-4 mr-2" />
                                                                    Lihat Foto
                                                                    Hasil
                                                                    Perbaikan
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    className="cursor-pointer text-sm"
                                                                >
                                                                    <Download className="w-4 h-4 mr-2" />
                                                                    Download
                                                                    Rincian
                                                                    Biaya (PDF)
                                                                </Button>
                                                            </div>
                                                        )}

                                                    {isCurrent &&
                                                        step.id === 5 && (
                                                            <div className="mt-3 p-3 bg-red-50 rounded-lg">
                                                                <p className="text-sm text-red-800 font-medium">
                                                                    Alasan
                                                                    penolakan:
                                                                </p>
                                                                <p className="text-sm text-red-700 mt-1">
                                                                    {selectedLaporan.alasan_penolakan ||
                                                                        "Fasilitas baru saja diperbaiki / Data tidak valid"}
                                                                </p>
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
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
                                                <img
                                                    key={index}
                                                    src={foto}
                                                    alt={`Foto laporan ${
                                                        index + 1
                                                    }`}
                                                    className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                                                    onClick={() =>
                                                        window.open(
                                                            foto,
                                                            "_blank"
                                                        )
                                                    }
                                                />
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Foto Bukti Perbaikan */}
                            {selectedLaporan.foto_bukti_perbaikan &&
                                selectedLaporan.foto_bukti_perbaikan.length >
                                    0 && (
                                    <div className="border-t border-gray-200 pt-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Foto Bukti Perbaikan
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {selectedLaporan.foto_bukti_perbaikan.map(
                                                (foto, index) => (
                                                    <img
                                                        key={index}
                                                        src={foto}
                                                        alt={`Bukti perbaikan ${
                                                            index + 1
                                                        }`}
                                                        className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                                                        onClick={() =>
                                                            window.open(
                                                                foto,
                                                                "_blank"
                                                            )
                                                        }
                                                    />
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Rincian Biaya PDF */}
                            {selectedLaporan.rincian_biaya_pdf && (
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Rincian Biaya
                                    </h3>
                                    <Button
                                        onClick={() =>
                                            window.open(
                                                selectedLaporan.rincian_biaya_pdf,
                                                "_blank"
                                            )
                                        }
                                        className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Rincian Biaya (PDF)
                                    </Button>
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