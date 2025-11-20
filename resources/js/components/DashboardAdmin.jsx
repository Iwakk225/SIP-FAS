import React, { useState, useEffect } from "react";
import {
    BarChart3,
    FileText,
    Users,
    User,
    Settings,
    Building2,
    LogOut,
    Menu,
    X,
    MapPin,
    Calendar,
    User as UserIcon,
    AlertCircle,
    RefreshCw,
    Info,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Upload // ✅ TAMBAHKAN IMPORT UPLOAD
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import axios from "axios";

export default function DashboardAdmin() {
    const [activePage, setActivePage] = useState("dashboard");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedLaporan, setSelectedLaporan] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedLaporanForUpload, setSelectedLaporanForUpload] = useState(null);
    const [buktiPhotos, setBuktiPhotos] = useState([]);
    const [pdfFile, setPdfFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const [notification, setNotification] = useState({
        show: false,
        message: "",
        type: "success",
    });

    // State untuk data dinamis dari database
    const [statsData, setStatsData] = useState({
        total: 0,
        validated: 0,
        inProgress: 0,
        completed: 0,
    });

    const [wilayahData, setWilayahData] = useState([
        { name: "Surabaya Barat", laporan: 0 },
        { name: "Surabaya Timur", laporan: 0 },
        { name: "Surabaya Utara", laporan: 0 },
        { name: "Surabaya Selatan", laporan: 0 },
        { name: "Surabaya Pusat", laporan: 0 },
    ]);

    const [laporanData, setLaporanData] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);

    // Komponen Notification Popup
    const NotificationPopup = () => {
        if (!notification.show) return null;

        const bgColor = {
            success: "bg-green-500",
            error: "bg-red-500",
            warning: "bg-yellow-500",
        };

        const icon = {
            success: <CheckCircle className="w-5 h-5" />,
            error: <XCircle className="w-5 h-5" />,
            warning: <AlertTriangle className="w-5 h-5" />,
        };

        // Auto hide setelah 3 detik
        useEffect(() => {
            const timer = setTimeout(() => {
                setNotification({ show: false, message: "", type: "success" });
            }, 3000);

            return () => clearTimeout(timer);
        }, [notification.show]);

        return (
            <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
                <div
                    className={`${bgColor[notification.type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 min-w-80`}
                >
                    {icon[notification.type]}
                    <span className="font-medium">{notification.message}</span>
                </div>
            </div>
        );
    };

    // Fungsi untuk show notification
    const showNotification = (message, type = "success") => {
        setNotification({
            show: true,
            message,
            type,
        });
    };

    // Fungsi untuk fetch data dari API Laravel
    const fetchLaporanData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("admin_token");

            if (!token) {
                console.error("No admin token found");
                return;
            }

            const response = await axios.get(
                "http://localhost:8000/api/admin/laporan",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    timeout: 10000,
                }
            );

            console.log("API Response:", response.data);

            const laporanArray = response.data.data || response.data;

            if (!Array.isArray(laporanArray)) {
                console.error("Invalid data format:", laporanArray);
                return;
            }

            console.log("Data dari database:", laporanArray);

            // Update stats data
            const total = laporanArray.length;
            const validated = laporanArray.filter(
                (l) => l.status === "Tervalidasi" || l.status === "tervalidasi"
            ).length;
            const inProgress = laporanArray.filter(
                (l) =>
                    l.status === "Dalam Proses" ||
                    l.status === "dalam_proses" ||
                    l.status === "dalam proses"
            ).length;
            const completed = laporanArray.filter(
                (l) => l.status === "Selesai" || l.status === "selesai"
            ).length;

            setStatsData({
                total,
                validated,
                inProgress,
                completed,
            });

            // Update data per wilayah
            const wilayahCount = {
                "Surabaya Barat": 0,
                "Surabaya Timur": 0,
                "Surabaya Utara": 0,
                "Surabaya Selatan": 0,
                "Surabaya Pusat": 0,
            };

            laporanArray.forEach((laporan) => {
                const lokasi = laporan.lokasi || "";
                const lokasiLower = lokasi.toLowerCase();

                if (lokasiLower.includes("barat")) wilayahCount["Surabaya Barat"]++;
                else if (lokasiLower.includes("timur")) wilayahCount["Surabaya Timur"]++;
                else if (lokasiLower.includes("utara")) wilayahCount["Surabaya Utara"]++;
                else if (lokasiLower.includes("selatan")) wilayahCount["Surabaya Selatan"]++;
                else if (lokasiLower.includes("pusat") || lokasiLower.includes("tengah"))
                    wilayahCount["Surabaya Pusat"]++;
                else {
                    wilayahCount["Surabaya Pusat"]++;
                }
            });

            setWilayahData([
                { name: "Surabaya Barat", laporan: wilayahCount["Surabaya Barat"] },
                { name: "Surabaya Timur", laporan: wilayahCount["Surabaya Timur"] },
                { name: "Surabaya Utara", laporan: wilayahCount["Surabaya Utara"] },
                { name: "Surabaya Selatan", laporan: wilayahCount["Surabaya Selatan"] },
                { name: "Surabaya Pusat", laporan: wilayahCount["Surabaya Pusat"] },
            ]);

            setLaporanData(laporanArray);

            // Generate recent activities
            const sortedLaporan = [...laporanArray]
                .sort((a, b) => new Date(b.created_at || b.tanggal) - new Date(a.created_at || a.tanggal))
                .slice(0, 3);

            const activities = sortedLaporan.map((laporan) => {
                let activity = {};
                const status = laporan.status?.toLowerCase();

                if (status === "validasi" || status === "pending") {
                    activity = {
                        type: "Laporan baru diterima",
                        description: laporan.judul,
                        time: formatTimeAgo(laporan.created_at),
                    };
                } else if (status === "tervalidasi" || status === "validated") {
                    activity = {
                        type: "Laporan divalidasi",
                        description: laporan.judul,
                        time: formatTimeAgo(laporan.created_at),
                    };
                } else if (status === "dalam_proses" || status === "dalam proses" || status === "in_progress") {
                    activity = {
                        type: "Petugas dikirim",
                        description: laporan.judul,
                        time: formatTimeAgo(laporan.created_at),
                    };
                } else {
                    activity = {
                        type: "Laporan diproses",
                        description: laporan.judul,
                        time: formatTimeAgo(laporan.created_at),
                    };
                }
                return activity;
            });

            setRecentActivities(activities);
        } catch (error) {
            console.error("Error fetching laporan data:", error);
            showNotification("Gagal memuat data laporan", "error");

            try {
                const storedLaporan = localStorage.getItem("laporan_data");
                if (storedLaporan) {
                    const laporanArray = JSON.parse(storedLaporan);
                    console.log("Menggunakan data dari localStorage:", laporanArray);

                    const total = laporanArray.length;
                    const validated = laporanArray.filter((l) => l.status === "Tervalidasi").length;
                    const inProgress = laporanArray.filter((l) => l.status === "Dalam Proses").length;
                    const completed = laporanArray.filter((l) => l.status === "Selesai").length;

                    setStatsData({ total, validated, inProgress, completed });
                    setLaporanData(laporanArray);
                }
            } catch (fallbackError) {
                console.error("Error fallback ke localStorage:", fallbackError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Fungsi untuk format waktu
    const formatTimeAgo = (dateString) => {
        if (!dateString) return "Beberapa waktu yang lalu";

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Baru saja";
        if (diffMins < 60) return `${diffMins} menit yang lalu`;
        if (diffHours < 24) return `${diffHours} jam yang lalu`;
        if (diffDays < 7) return `${diffDays} hari yang lalu`;

        return date.toLocaleDateString("id-ID");
    };

    // Load data saat component mount
    useEffect(() => {
        fetchLaporanData();

        const interval = setInterval(fetchLaporanData, 30000);

        return () => clearInterval(interval);
    }, []);

    // Fungsi untuk validasi laporan
    const handleValidateLaporan = async (laporanId) => {
        try {
            const token = localStorage.getItem("admin_token");

            const response = await axios.put(
                `http://localhost:8000/api/admin/laporan/${laporanId}/validate`,
                { status: "Tervalidasi" },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data.success) {
                fetchLaporanData();
                setShowDetailModal(false);
                showNotification("Laporan berhasil divalidasi!", "success");
            }
        } catch (error) {
            console.error("Error validating laporan:", error);
            showNotification("Gagal memvalidasi laporan", "error");
        }
    };

    // Fungsi untuk update status laporan
    const handleUpdateStatus = async (laporanId, newStatus) => {
        try {
            const token = localStorage.getItem("admin_token");

            const response = await axios.put(
                `http://localhost:8000/api/admin/laporan/${laporanId}`,
                { status: newStatus },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data.success) {
                fetchLaporanData();
                setShowDetailModal(false);
                showNotification(`Status berhasil diubah menjadi: ${newStatus}`, "success");
            }
        } catch (error) {
            console.error("Error updating laporan status:", error);
            showNotification("Gagal mengupdate status laporan", "error");
        }
    };

    // Fungsi untuk upload modal
    const handleOpenUploadModal = (laporan) => {
        setSelectedLaporanForUpload(laporan);
        setShowUploadModal(true);
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        const imageFiles = files.filter((file) => file.type.startsWith("image/"));

        const newPhotos = imageFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));

        setBuktiPhotos((prev) => [...prev, ...newPhotos]);
    };

    const handlePdfUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "application/pdf") {
            setPdfFile(file);
        }
    };

    const handleUploadBukti = async () => {
        try {
            const token = localStorage.getItem("admin_token");
            const formData = new FormData();

            buktiPhotos.forEach((photo) => {
                formData.append("foto_bukti_perbaikan[]", photo.file);
            });

            const response = await axios.post(
                `http://localhost:8000/api/admin/laporan/${selectedLaporanForUpload.id}/upload-bukti`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (response.data.success) {
                showNotification("Bukti perbaikan berhasil diupload!", "success");
                setShowUploadModal(false);
                setBuktiPhotos([]);
                fetchLaporanData();
            }
        } catch (error) {
            console.error("Error uploading bukti:", error);
            showNotification("Gagal upload bukti perbaikan", "error");
        }
    };

    const handleUploadRincianBiaya = async () => {
        if (!pdfFile) return;

        try {
            const token = localStorage.getItem("admin_token");
            const formData = new FormData();
            formData.append("rincian_biaya_pdf", pdfFile);

            const response = await axios.post(
                `http://localhost:8000/api/admin/laporan/${selectedLaporanForUpload.id}/upload-rincian-biaya`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (response.data.success) {
                showNotification("Rincian biaya berhasil diupload!", "success");
                setPdfFile(null);
                fetchLaporanData();
            }
        } catch (error) {
            console.error("Error uploading rincian biaya:", error);
            showNotification("Gagal upload rincian biaya", "error");
        }
    };

    const handleCloseUploadModal = () => {
        setShowUploadModal(false);
        setBuktiPhotos([]);
        setPdfFile(null);
    };

    // Data petugas
    const petugasData = [
        {
            id: 1,
            nama: "Agus Setiawan",
            kontak: "081234567890",
            wilayah: "Surabaya Barat, Surabaya Utara",
            status: "Aktif",
            tugas: "Menangani 2 laporan jalan rusak",
        },
        {
            id: 2,
            nama: "Bambang Wijaya",
            kontak: "081234567891",
            wilayah: "Surabaya Timur, Surabaya Selatan",
            status: "Aktif",
            tugas: "Perbaikan lampu jalan",
        },
    ];

    // Fungsi untuk membuka modal detail
    const handleDetailClick = (laporan) => {
        setSelectedLaporan(laporan);
        setShowDetailModal(true);
    };

    // Fungsi untuk menutup modal
    const handleCloseModal = () => {
        setShowDetailModal(false);
        setSelectedLaporan(null);
    };

    // Fungsi Logout
    const handleLogout = () => {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        navigate("/LoginAdmin");
    };

    // Komponen Modal Detail Laporan
    const DetailLaporanModal = () => {
        if (!selectedLaporan) return null;

        const getStatusColor = (status) => {
            const statusLower = status?.toLowerCase();
            if (statusLower === "validasi" || statusLower === "pending")
                return "bg-yellow-100 text-yellow-800";
            if (statusLower === "tervalidasi" || statusLower === "validated")
                return "bg-green-100 text-green-800";
            if (statusLower === "dalam_proses" || statusLower === "dalam proses" || statusLower === "in_progress")
                return "bg-blue-100 text-blue-800";
            if (statusLower === "selesai" || statusLower === "completed")
                return "bg-gray-100 text-gray-800";
            return "bg-gray-100 text-gray-800";
        };

        const getStatusText = (status) => {
            const statusLower = status?.toLowerCase();
            if (statusLower === "validasi" || statusLower === "pending")
                return "Validasi";
            if (statusLower === "tervalidasi" || statusLower === "validated")
                return "Tervalidasi";
            if (statusLower === "dalam_proses" || statusLower === "dalam proses" || statusLower === "in_progress")
                return "Dalam Proses";
            if (statusLower === "selesai" || statusLower === "completed")
                return "Selesai";
            return status;
        };

        return (
            <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="border-b border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Detail Laporan</h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {selectedLaporan.judul}
                            </h3>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-gray-700">
                                    {selectedLaporan.deskripsi}
                                </p>
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
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                            selectedLaporan.status
                                        )}`}
                                    >
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
                                onClick={() => handleOpenUploadModal(selectedLaporan)}
                                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium cursor-pointer transition-colors flex items-center"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Bukti Perbaikan
                            </button>

                            {(selectedLaporan.status === "Validasi" || selectedLaporan.status === "validasi") && (
                                <button
                                    onClick={() => handleValidateLaporan(selectedLaporan.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium cursor-pointer transition-colors"
                                >
                                    Validasi Laporan
                                </button>
                            )}

                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ubah Status:
                                </label>
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
        );
    };

    // Komponen UploadBuktiModal
    const UploadBuktiModal = () => {
        return (
            <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="border-b border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Upload Bukti Perbaikan</h2>
                            <button
                                onClick={handleCloseUploadModal}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-900 mb-2">
                                {selectedLaporanForUpload?.judul}
                            </h3>
                            <p className="text-sm text-blue-700">
                                Lokasi: {selectedLaporanForUpload?.lokasi}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Foto Bukti Perbaikan</h3>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="mb-4 w-full border border-gray-300 rounded-lg p-2"
                            />

                            {buktiPhotos.length > 0 && (
                                <div className="grid grid-cols-3 gap-3 mt-4">
                                    {buktiPhotos.map((photo, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={photo.preview}
                                                alt={`Bukti ${index + 1}`}
                                                className="w-full h-24 object-cover rounded-lg"
                                            />
                                            <button
                                                onClick={() => setBuktiPhotos(buktiPhotos.filter((_, i) => i !== index))}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm cursor-pointer"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Button
                                onClick={handleUploadBukti}
                                disabled={buktiPhotos.length === 0}
                                className="mt-4 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Foto Bukti ({buktiPhotos.length})
                            </Button>
                        </div>

                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rincian Biaya (PDF)</h3>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handlePdfUpload}
                                className="mb-4 w-full border border-gray-300 rounded-lg p-2"
                            />

                            {pdfFile && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                    <p className="text-sm text-green-800 font-medium">
                                        File terpilih: {pdfFile.name}
                                    </p>
                                    <p className="text-xs text-green-600">
                                        Size: {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            )}

                            <Button
                                onClick={handleUploadRincianBiaya}
                                disabled={!pdfFile}
                                className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Rincian Biaya
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Komponen Dashboard
    const DashboardPage = () => (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">Selamat Datang, Admin</h1>
                        <p className="text-blue-100">Kelola laporan fasilitas Kota Surabaya</p>
                    </div>
                    <button
                        onClick={fetchLaporanData}
                        disabled={isLoading}
                        className="bg-blue-500 hover:bg-blue-400 text-white p-2 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
                    <p className="text-gray-600">Memuat data laporan dari database...</p>
                </div>
            )}

            {!isLoading && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                            <div className="text-2xl font-bold text-gray-900">{statsData.total}</div>
                            <div className="text-sm text-gray-500">Total Laporan</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                            <div className="text-2xl font-bold text-green-600">{statsData.validated}</div>
                            <div className="text-sm text-gray-500">Tervalidasi</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                            <div className="text-2xl font-bold text-yellow-600">{statsData.inProgress}</div>
                            <div className="text-sm text-gray-500">Dalam Proses</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                            <div className="text-2xl font-bold text-blue-600">{statsData.completed}</div>
                            <div className="text-sm text-gray-500">Selesai</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Laporan per Wilayah</h3>
                            <div className="space-y-3">
                                {wilayahData.map((wilayah, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                                        <span className="text-sm text-gray-700">{wilayah.name}</span>
                                        <span className="font-semibold text-gray-900">{wilayah.laporan}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktivitas Terbaru</h3>
                            <div className="space-y-4">
                                {recentActivities.map((activity, index) => (
                                    <div key={index} className="flex items-start space-x-3">
                                        <div
                                            className={`w-2 h-2 rounded-full mt-2 ${
                                                activity.type.includes("baru")
                                                    ? "bg-green-500"
                                                    : activity.type.includes("validasi")
                                                    ? "bg-blue-500"
                                                    : "bg-yellow-500"
                                            }`}
                                        ></div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{activity.type}</p>
                                            <p className="text-sm text-gray-600">{activity.description}</p>
                                            <p className="text-xs text-gray-400">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    // Komponen Data Petugas
    const DataPetugasPage = () => (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Data Petugas</h1>
                <p className="text-gray-600">Kelola petugas lapangan</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NAMA</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KONTAK</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">WILAYAH TUGAS</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STATUS</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AKSI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {petugasData.map((petugas) => (
                                <tr key={petugas.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{petugas.nama}</div>
                                            <div className="text-sm text-gray-500">{petugas.tugas}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{petugas.kontak}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{petugas.wilayah}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                petugas.status === "Aktif"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-gray-100 text-gray-800"
                                            }`}
                                        >
                                            {petugas.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-blue-600 hover:text-blue-900 text-sm font-medium cursor-pointer">
                                            Ubah Status
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    // Komponen Profil
    const ProfilPage = () => (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Profil Admin</h1>
                <p className="text-gray-600">Kelola informasi akun administrator</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer">
                            Ubah Foto
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-gray-900">Admin SIP-FAS</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon</label>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-gray-900">031-1234567</span>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Instansi</label>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-gray-900">Dinas Pekerjaan Umum Kota Surabaya</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium cursor-pointer">
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        </div>
    );

    // Komponen Pengaturan
    const PengaturanPage = () => (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
                <p className="text-gray-600">Kelola pengaturan sistem</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-gray-600">Fitur pengaturan akan segera tersedia.</p>
            </div>
        </div>
    );

    // Komponen Data Laporan
    const DataLaporanPage = () => {
        const getStatusColor = (status) => {
            const statusLower = status?.toLowerCase();
            if (statusLower === "validasi" || statusLower === "pending")
                return "bg-yellow-100 text-yellow-800";
            if (statusLower === "tervalidasi" || statusLower === "validated")
                return "bg-green-100 text-green-800";
            if (statusLower === "dalam_proses" || statusLower === "dalam proses" || statusLower === "in_progress")
                return "bg-blue-100 text-blue-800";
            if (statusLower === "selesai" || statusLower === "completed")
                return "bg-gray-100 text-gray-800";
            return "bg-gray-100 text-gray-800";
        };

        const getStatusText = (status) => {
            const statusLower = status?.toLowerCase();
            if (statusLower === "validasi" || statusLower === "pending")
                return "Validasi";
            if (statusLower === "tervalidasi" || statusLower === "validated")
                return "Tervalidasi";
            if (statusLower === "dalam_proses" || statusLower === "dalam proses" || statusLower === "in_progress")
                return "Dalam Proses";
            if (statusLower === "selesai" || statusLower === "completed")
                return "Selesai";
            return status;
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
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                            laporan.status
                                                        )}`}
                                                    >
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

                <DetailLaporanModal />
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="bg-blue-600 p-2 rounded-lg">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">SIP-FAS</h1>
                                <p className="text-sm text-gray-500">Kota Surabaya</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="hidden md:block text-right">
                                <p className="text-sm font-medium text-gray-900">Admin Surabaya</p>
                                <p className="text-xs text-gray-500">Administrator</p>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 cursor-pointer"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="hidden md:block text-sm font-medium">Logout</span>
                            </button>

                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                            >
                                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="hidden lg:block lg:w-64 flex-shrink-0">
                        <nav className="bg-white rounded-lg border border-gray-200 p-4 sticky top-8">
                            <div className="space-y-2">
                                {[
                                    { id: "dashboard", icon: BarChart3, label: "Dashboard" },
                                    { id: "laporan", icon: FileText, label: "Data Laporan" },
                                    { id: "petugas", icon: Users, label: "Data Petugas" },
                                    { id: "profil", icon: User, label: "Profil" },
                                    { id: "pengaturan", icon: Settings, label: "Pengaturan" },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActivePage(item.id)}
                                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                                            activePage === item.id
                                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                : "text-gray-700 hover:bg-gray-50"
                                        }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </nav>
                    </div>

                    <div className="flex-1 min-w-0">
                        {activePage === "dashboard" && <DashboardPage />}
                        {activePage === "laporan" && <DataLaporanPage />}
                        {activePage === "petugas" && <DataPetugasPage />}
                        {activePage === "profil" && <ProfilPage />}
                        {activePage === "pengaturan" && <PengaturanPage />}
                    </div>
                </div>
            </div>

            {showDetailModal && <DetailLaporanModal />}
            {showUploadModal && <UploadBuktiModal />}

            <NotificationPopup />
        </div>
    );
}