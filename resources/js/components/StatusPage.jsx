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
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DetailLaporanModal from "../components/modals/DetailLaporanModal";
import SimpleReportModal from "../components/modals/SimpleReportModal";

const StatusPage = () => {
  const [laporanData, setLaporanData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua status");
  const [sortBy, setSortBy] = useState("terbaru");
  const [selectedLaporan, setSelectedLaporan] = useState(null);
  const [showSimpleModal, setShowSimpleModal] = useState(false);
  const [showFullModal, setShowFullModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

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
    try {
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) throw new Error(`Download failed: ${response.status}`);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);
    } catch (error) {
      alert(`Gagal download. Coba buka manual: ${url}`);
      window.open(url, '_blank');
    }
  };

  // Fetch data laporan user
  const fetchLaporanUser = async () => {
    if (!user) {
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
        { headers, timeout: 10000 }
      );
      const data = response.data.data || response.data;
      setLaporanData(data);
      setFilteredData(data);
    } catch (error) {
      console.error("Error fetching user laporan:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        navigate('/LoginPage');
      }
      setError("Gagal memuat data laporan. Silakan coba lagi.");
      setLaporanData([]);
      setFilteredData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // GANTI HANDLE DETAIL CLICK
  const handleDetailClick = (laporan) => {
    setSelectedLaporan(laporan);
    setShowSimpleModal(true); // Buka modal ringkas
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
      return sortBy === "terbaru" ? dateB - dateA : dateA - dateB;
    });
    setFilteredData(result);
  }, [laporanData, searchTerm, statusFilter, sortBy]);

  // Load data saat component mount
  useEffect(() => {
    fetchLaporanUser();
  }, [user]);

  const handleRetry = () => {
    fetchLaporanUser();
  };

  // Stats calculation
  const stats = {
    total: laporanData.length,
    menunggu: laporanData.filter((l) => l.status === "Validasi").length,
    dalamProses: laporanData.filter((l) => l.status === "Dalam Proses").length,
    selesai: laporanData.filter((l) => l.status === "Selesai").length,
    ditolak: laporanData.filter((l) => l.status === "Ditolak").length,
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
    if (statusLower === "dalam proses") return "bg-orange-100 text-orange-800";
    if (statusLower === "selesai") return "bg-green-100 text-green-800";
    if (statusLower === "ditolak") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header & Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Laporan Saya</h1>
          <p className="text-gray-600">Pantau progress laporan yang telah Anda kirim</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-800">Total Laporan</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.menunggu}</div>
              <div className="text-sm text-yellow-800">Menunggu</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.dalamProses}</div>
              <div className="text-sm text-orange-800">Dalam Proses</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.selesai}</div>
              <div className="text-sm text-green-800">Selesai</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.ditolak}</div>
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
                  <Button onClick={handleRetry} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer text-sm">
                    Coba Lagi
                  </Button>
                  <Button onClick={() => navigate('/LoginPage')} variant="outline" className="cursor-pointer text-sm">
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
                <div key={laporan.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{laporan.judul}</h3>
                          <div className="flex items-center mt-1 space-x-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(laporan.status)}`}>
                              {getStatusText(laporan.status)}
                            </span>
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
                            {laporan.status === "Ditolak" && laporan.alasan_penolakan && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Ada alasan penolakan
                              </span>
                            )}
                          </div>
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
                          <span>{laporan.lokasi}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{formatDate(laporan.created_at || laporan.tanggal)}</span>
                        </div>
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          <span>ID: {laporan.id}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm line-clamp-2">{laporan.deskripsi}</p>
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-6 flex space-x-2">
                      <Button
                        onClick={() => handleDetailClick(laporan)}
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada laporan</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== "Semua status"
                    ? "Tidak ada laporan yang sesuai dengan filter"
                    : "Belum ada laporan yang dikirim"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* GANTI MODAL LAMA DENGAN DUA MODAL BARU */}
        <SimpleReportModal
          isOpen={showSimpleModal}
          onClose={() => setShowSimpleModal(false)}
          report={selectedLaporan}
          onViewFullDetails={(report) => {
            setSelectedLaporan(report);
            setShowFullModal(true);
          }}
        />

        {/* Modal Lengkap */}
        <DetailLaporanModal
          isOpen={showFullModal}
          onClose={() => setShowFullModal(false)}
          laporan={selectedLaporan}
          onRatingSubmit={() => fetchLaporanUser()}
        />
      </div>
    </div>
  );
};

export default StatusPage;