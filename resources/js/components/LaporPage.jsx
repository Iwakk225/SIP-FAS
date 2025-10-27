import React, { useState } from "react";
import { MapPin, Camera, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Footer from "./Footer";
import NavbarBeforeLogin from "./NavbarBeforeLogin";

// ✅ Import dari react-leaflet
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
    const files = Array.from(e.target.files);
    const newPhotos = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  // gunakan lokasi user
  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter({ lat: latitude, lng: longitude });
          setFormData((prev) => ({
            ...prev,
            lokasi: `${latitude}, ${longitude}`,
          }));
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

  return (
    <>
      <NavbarBeforeLogin />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-slate-700 text-white rounded-t-lg p-6">
            <h1 className="text-2xl font-bold">Buat Laporan Baru</h1>
            <p className="text-slate-200 text-sm mt-1">
              Laporkan kerusakan fasilitas umum di sekitar anda
            </p>
          </div>

          <div className="bg-white rounded-b-lg shadow-lg p-6 space-y-6">
            {/* Judul Laporan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Judul laporan <span className="text-red-500">*</span>
              </label>
              <Input
                name="judul"
                value={formData.judul}
                onChange={handleInputChange}
                placeholder="Contoh : Jalan berlubang di Jl. Petemon"
                className="w-full"
              />
            </div>

            {/* Lokasi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lokasi
              </label>
              <Input
                name="lokasi"
                value={formData.lokasi}
                onChange={handleInputChange}
                placeholder="Contoh : Jl. Petemon No. 123, Surabaya Selatan"
                className="w-full"
              />
            </div>

            {/* Deskripsi */}
            <div>
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
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                  position={[mapCenter.lat, mapCenter.lng]}
                  icon={markerIcon}
                ></Marker>
                <ChangeMapView coords={[mapCenter.lat, mapCenter.lng]} />
              </MapContainer>

              <Button
                onClick={handleUseMyLocation}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium cursor-pointer"
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
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
                  <li>
                    Ambil foto yang jelas dan menunjukkan kerusakan fasilitas
                  </li>
                  <li>Berikan deskripsi yang detail dan spesifik</li>
                  <li>
                    Cantumkan alamat dan bila perlu gunakan fitur "Gunakan
                    Lokasi Saya"
                  </li>
                </ol>
              </AlertDescription>
            </Alert>

            {/* Tombol Submit */}
            <Button
              onClick={handleSubmit}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold py-6 text-base cursor-pointer"
            >
              <Info className="w-5 h-5 mr-2" />
              Kirim Laporan
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LaporPage;
