import React, { useState } from "react";
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
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DashboardAdmin() {
  const [activePage, setActivePage] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedLaporan, setSelectedLaporan] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const navigate = useNavigate();

  // Data sampel untuk dashboard
  const statsData = {
    total: 156,
    validated: 89,
    inProgress: 34,
    completed: 33
  };

  const wilayahData = [
    { name: "Surabaya Barat", laporan: 45 },
    { name: "Surabaya Timur", laporan: 38 },
    { name: "Surabaya Utara", laporan: 32 },
    { name: "Surabaya Selatan", laporan: 28 },
    { name: "Surabaya Pusat", laporan: 13 },
  ];

  const laporanData = [
    {
      id: 1,
      judul: "Jalan Berlubang di Jl. Raya Darmo",
      pelapor: "Ahmad Wijaya",
      kategori: "Jalan",
      lokasi: "Jl. Raya Darmo No. 123, Surabaya Barat",
      status: "Validasi",
      tanggal: "2024-01-15",
      deskripsi: "Terdapat lubang besar di tengah jalan yang sangat berbahaya untuk kendaraan. Lubang berdiameter sekitar 2 meter dengan kedalaman 30cm."
    },
    {
      id: 2,
      judul: "Lampu Jalan Mati Total",
      pelapor: "Siti Nurhaliza",
      kategori: "Penerangan",
      lokasi: "Jl. Pemuda, Surabaya Timur",
      status: "Tervalidasi",
      tanggal: "2024-01-14",
      deskripsi: "Lampu jalan di sepanjang Jl. Pemuda mati total sejak 3 hari yang lalu, mengakibatkan gelap dan rawan kecelakaan."
    },
    {
      id: 3,
      judul: "Saluran Air Tersumbat",
      pelapor: "Budi Santoso",
      kategori: "Drainase",
      lokasi: "Jl. Gubeng Raya, Surabaya Selatan",
      status: "Dalam Proses",
      tanggal: "2024-01-13",
      deskripsi: "Saluran air di depan rumah No. 45 tersumbat oleh sampah dan menyebabkan genangan air saat hujan."
    },
    {
      id: 4,
      judul: "Taman Rusak dan Kotor",
      pelapor: "Maya Sari",
      kategori: "Taman",
      lokasi: "Taman Bungkul, Surabaya Selatan",
      status: "Selesai",
      tanggal: "2024-01-12",
      deskripsi: "Beberapa tanaman di Taman Bungkul mati dan sampah berserakan di beberapa titik, mengurangi keindahan taman."
    }
  ];

  const petugasData = [
    {
      id: 1,
      nama: "Agus Setiawan",
      kontak: "081234567890",
      wilayah: "Surabaya Barat, Surabaya Utara",
      status: "Aktif",
      tugas: "Merangani 2 laporan jalan rusak"
    },
    {
      id: 2,
      nama: "Bambang Wijaya",
      kontak: "081234567891",
      wilayah: "Surabaya Timur, Surabaya Selatan",
      status: "Aktif",
      tugas: "Perbaikan lampu jalan"
    },
    {
      id: 3,
      nama: "Dedi Kurniawan",
      kontak: "081234567892",
      wilayah: "Surabaya Pusat",
      status: "Tidak Aktif",
      tugas: "Tidak ada tugas"
    }
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
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/LoginAdmin');
  };

  // Komponen Modal Detail Laporan
  const DetailLaporanModal = () => {
    if (!selectedLaporan) return null;

    return (
      <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header Modal */}
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

          {/* Content Modal */}
          <div className="p-6 space-y-6">
            {/* Judul Laporan */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedLaporan.judul}
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">{selectedLaporan.deskripsi}</p>
              </div>
            </div>

            {/* Informasi Laporan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lokasi */}
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Lokasi</p>
                  <p className="text-sm text-gray-900">{selectedLaporan.lokasi}</p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedLaporan.status === 'Validasi' ? 'bg-yellow-100 text-yellow-800' :
                    selectedLaporan.status === 'Tervalidasi' ? 'bg-green-100 text-green-800' :
                    selectedLaporan.status === 'Dalam Proses' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedLaporan.status}
                  </span>
                </div>
              </div>

              {/* Tanggal Laporan */}
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Tanggal Laporan</p>
                  <p className="text-sm text-gray-900">{selectedLaporan.tanggal}</p>
                </div>
              </div>

              {/* Pelapor */}
              <div className="flex items-start space-x-3">
                <UserIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Pelapor</p>
                  <p className="text-sm text-gray-900">{selectedLaporan.pelapor}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium cursor-pointer transition-colors">
                Validasi
              </button>
              <button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium cursor-pointer transition-colors">
                Edit Status
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  // Detail laporan end

  // Komponen Dashboard
  const DashboardPage = () => (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">Selamat Datang, Admin</h1>
        <p className="text-blue-100">Kelola laporan fasilitas Kota Surabaya</p>
      </div>

      {/* Stats Cards */}
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
        {/* Laporan per Wilayah */}
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

        {/* Aktivitas Terbaru */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktivitas Terbaru</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Laporan baru diterima</p>
                <p className="text-sm text-gray-600">Jalan berlubang di Surabaya Barat</p>
                <p className="text-xs text-gray-400">5 menit yang lalu</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Laporan divalidasi</p>
                <p className="text-sm text-gray-600">Lampu jalan mati di Surabaya Timur</p>
                <p className="text-xs text-gray-400">15 menit yang lalu</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Petugas dikirim</p>
                <p className="text-sm text-gray-600">Saluran tersumbat di Surabaya Selatan</p>
                <p className="text-xs text-gray-400">1 jam yang lalu</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Komponen Data Laporan
  const DataLaporanPage = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Laporan</h1>
          <p className="text-gray-600">Kelola semua laporan fasilitas umum</p>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
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
              {laporanData.map((laporan, index) => (
                <tr key={laporan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{laporan.judul}</div>
                      <div className="text-sm text-gray-500">Pelapor: {laporan.pelapor}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{laporan.lokasi}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{laporan.tanggal}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      laporan.status === 'Validasi' ? 'bg-yellow-100 text-yellow-800' :
                      laporan.status === 'Tervalidasi' ? 'bg-green-100 text-green-800' :
                      laporan.status === 'Dalam Proses' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {laporan.status}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Laporan */}
      <DetailLaporanModal />
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      petugas.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
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

  // Navigation items
  const navItems = [
    { id: "dashboard", icon: BarChart3, label: "Dashboard" },
    { id: "laporan", icon: FileText, label: "Data Laporan" },
    { id: "petugas", icon: Users, label: "Data Petugas" },
    { id: "profil", icon: User, label: "Profil" },
    { id: "pengaturan", icon: Settings, label: "Pengaturan" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Standalone untuk Admin */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SIP-FAS</h1>
                <p className="text-sm text-gray-500">Kota Surabaya</p>
              </div>
            </div>
            
            {/* User Info & Logout */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">Admin Surabaya</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden md:block text-sm font-medium">Logout</span>
              </button>

              {/* Mobile Menu Button */}
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
          {/* Sidebar - Desktop */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg border border-gray-200 p-4 sticky top-8">
              <div className="space-y-2">
                {navItems.map((item) => (
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

          {/* Mobile Sidebar */}
          {isMobileMenuOpen && (
            <div className="lg:hidden bg-white rounded-lg border border-gray-200 p-4">
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActivePage(item.id);
                      setIsMobileMenuOpen(false);
                    }}
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
              </nav>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {activePage === "dashboard" && <DashboardPage />}
            {activePage === "laporan" && <DataLaporanPage />}
            {activePage === "petugas" && <DataPetugasPage />}
            {activePage === "profil" && <ProfilPage />}
            {activePage === "pengaturan" && <PengaturanPage />}
          </div>
        </div>
      </div>

      {/* Render Modal */}
      {showDetailModal && <DetailLaporanModal />}
    </div>
  );
}