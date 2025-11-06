import React, { useState, useEffect } from "react";
import { MapPin, Camera, Info, LogIn, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import Footer from "./Footer";

// ✅ Import dari react-leaflet
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ✅ Import useAuth
import { useAuth } from "../contexts/AuthContext";

// ✅ Fix icon default Leaflet yang error di React
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// ✅ Komponen bantu untuk ubah view map
function ChangeMapView({ coords }) {
  const map = useMap();
  map.setView(coords, 15);
  return null;
}

const LaporPage = () => {
  const [formData, setFormData] = useState({
    judul: "",
    lokasi: "",
    deskripsi: "",
  });
  const [photos, setPhotos] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: -7.2575, lng: 112.7521 }); // Default Surabaya
  const [showLoginModal, setShowLoginModal] = useState(false);
  
 // ✅ GUNAKAN isLoggedIn DARI CONTEXT
  const { isLoggedIn, user } = useAuth();

  // Batas map hanya dikota Surabaya
  const surabayaBounds = L.latLngBounds(
    L.latLng(-7.37, 112.55), // barat daya (SW)
    L.latLng(-7.18, 112.85)  // timur laut (NE)
  );

  // Auto geser setelah user menginput alamat/lokasi (Hanya didaerah Kota Surabaya)
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (formData.lokasi.trim().length > 3) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&viewbox=112.55,-7.18,112.85,-7.37&bounded=1&q=${encodeURIComponent(
              formData.lokasi + " Surabaya"
            )}`
          );
          const data = await response.json();
          if (data && data.length > 0) {
            const { lat, lon } = data[0];
            setMapCenter({ lat: parseFloat(lat), lng: parseFloat(lon) });
          }
        } catch (error) {
          console.error("Error fetching location:", error);
        }
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [formData.lokasi]);

  // handle perubahan input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // upload foto
  const handlePhotoUpload = (e) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    
    const files = Array.from(e.target.files);
    const newPhotos = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  // gunakan lokasi user
  const handleUseMyLocation = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // Memastikan Lokasi masih didaerah kota Surabaya
          if (surabayaBounds.contains([latitude, longitude])) {
            setMapCenter({ lat: latitude, lng: longitude });
            setFormData((prev) => ({
              ...prev,
              lokasi: `${latitude}, ${longitude}`,
            }));
          } else {
            alert("Lokasi Anda di luar area Surabaya!");
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Tidak dapat mengakses lokasi Anda");
        }
      );
    } else {
      alert("Browser Anda tidak mendukung geolokasi");
    }
  };

  // kirim laporan ke backend Laravel
  const handleSubmit = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    if (
      !formData.judul ||
      !formData.lokasi ||
      !formData.deskripsi ||
      photos.length === 0
    ) {
      alert("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("judul", formData.judul);
    formDataToSend.append("lokasi", formData.lokasi);
    formDataToSend.append("deskripsi", formData.deskripsi);
    photos.forEach((photo, index) => {
      formDataToSend.append(`photos[${index}]`, photo.file);
    });

    try {
      const response = await fetch("http://localhost:8000/api/laporan", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formDataToSend,
      });

      if (response.ok) {
        alert("Laporan berhasil dikirim!");
        setFormData({ judul: "", lokasi: "", deskripsi: "" });
        setPhotos([]);
      } else {
        alert("Gagal mengirim laporan");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan koneksi ke server");
    }
  };

  // Handle click pada form fields untuk guest
  const handleGuestInteraction = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-slate-700 text-white rounded-t-lg p-6">
            <h1 className="text-2xl font-bold">Buat Laporan Baru</h1>
            <p className="text-slate-200 text-sm mt-1">
              Laporkan kerusakan fasilitas umum di sekitar anda
            </p>
          </div>

          <div className="bg-white rounded-b-lg shadow-lg p-6 space-y-6">
            {/* Alert untuk Guest */}
            {!isLoggedIn && (
              <Alert className="bg-amber-50 border-amber-200">
                <Info className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-sm text-amber-800">
                  <p className="font-medium">
                    ⚠️ Anda perlu login untuk membuat laporan
                  </p>
                  <p className="text-xs mt-1">
                    Silakan login atau daftar akun terlebih dahulu untuk melaporkan kerusakan fasilitas.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Link to="/LoginPage">
                      <Button className="bg-amber-500 hover:bg-amber-600 text-white text-xs py-1 h-auto cursor-pointer">
                        <LogIn className="w-3 h-3 mr-1" />
                        Login
                      </Button>
                    </Link>
                    <Link to="/SignUpPage">
                      <Button variant="outline" className="text-xs py-1 h-auto cursor-pointer">
                        <UserPlus className="w-3 h-3 mr-1" />
                        Daftar
                      </Button>
                    </Link>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Judul Laporan */}
            <div onClick={handleGuestInteraction}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Judul laporan <span className="text-red-500">*</span>
              </label>
              <Input
                name="judul"
                value={formData.judul}
                onChange={handleInputChange}
                placeholder="Contoh : Jalan berlubang di Jl. Petemon"
                className="w-full"
                disabled={!isLoggedIn}
              />
            </div>

            {/* Lokasi */}
            <div onClick={handleGuestInteraction}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lokasi
              </label>
              <Input
                name="lokasi"
                value={formData.lokasi}
                onChange={handleInputChange}
                placeholder="Contoh : Jalan Patemon Kuburan"
                className="w-full"
                disabled={!isLoggedIn}
              />
            </div>

            {/* Deskripsi */}
            <div onClick={handleGuestInteraction}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <Textarea
                name="deskripsi"
                value={formData.deskripsi}
                onChange={handleInputChange}
                placeholder="Jelaskan kondisinya secara detail..."
                className="w-full min-h-32 resize-none"
                maxLength={500}
                disabled={!isLoggedIn}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {formData.deskripsi.length}/500 kata
              </div>
            </div>

            {/* Map Interaktif */}
            <div className="relative rounded-lg overflow-hidden">
              <MapContainer
                center={[mapCenter.lat, mapCenter.lng]}
                zoom={13}
                scrollWheelZoom={false}
                className="h-56 w-full z-0"
                maxBounds={surabayaBounds} // ✅ batasi area map hanya Surabaya
                maxBoundsViscosity={1.0} // agar map tidak bisa keluar
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                  position={[mapCenter.lat, mapCenter.lng]}
                  icon={markerIcon}
                />
                <ChangeMapView coords={[mapCenter.lat, mapCenter.lng]} />
              </MapContainer>

              <Button
                onClick={handleUseMyLocation}
                disabled={!isLoggedIn}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Gunakan Lokasi Saya
              </Button>
            </div>

            {/* Foto Fasilitas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto fasilitas <span className="text-red-500">*</span>
              </label>
              <div 
                className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  isLoggedIn ? 'hover:border-gray-400' : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={handleGuestInteraction}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                  disabled={!isLoggedIn}
                />
                <label 
                  htmlFor="photo-upload" 
                  className={`cursor-pointer ${!isLoggedIn ? 'cursor-not-allowed' : ''}`}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Klik atau drop gambar disini
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG hingga 10 MB
                    </p>
                  </div>
                </label>
              </div>

              {/* Preview Foto */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() =>
                          setPhotos(photos.filter((_, i) => i !== index))
                        }
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tips */}
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800">
                <p className="font-medium mb-2">Tips laporan yang baik</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Ambil foto yang jelas dan menunjukkan kerusakan fasilitas</li>
                  <li>Berikan deskripsi yang detail dan spesifik</li>
                  <li>
                    Cantumkan alamat dan bila perlu gunakan fitur "Gunakan Lokasi Saya"
                  </li>
                </ol>
              </AlertDescription>
            </Alert>

            {/* Tombol Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!isLoggedIn}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold py-6 text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Info className="w-5 h-5 mr-2" />
              {isLoggedIn ? 'Kirim Laporan' : 'Login untuk Melaporkan'}
            </Button>
          </div>
        </div>
      </div>
      <Footer />

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Login Diperlukan
              </h3>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-amber-600" />
              </div>
              <p className="text-gray-600 mb-2">
                Anda perlu login untuk membuat laporan
              </p>
              <p className="text-sm text-gray-500">
                Login atau daftar akun untuk melaporkan kerusakan fasilitas
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              <Link to="/LoginPage" onClick={() => setShowLoginModal(false)}>
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 cursor-pointer">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login ke Akun
                </Button>
              </Link>
              
              <Link to="/SignUpPage" onClick={() => setShowLoginModal(false)}>
                <Button variant="outline" className="w-full font-medium py-3 cursor-pointer">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Daftar Akun Baru
                </Button>
              </Link>

              <button
                onClick={() => setShowLoginModal(false)}
                className="text-sm text-gray-500 hover:text-gray-700 py-2 cursor-pointer"
              >
                Nanti saja
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LaporPage;