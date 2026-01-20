import React, { useState, useEffect, useRef } from "react";
import { MapPin, Camera, Info, LogIn, UserPlus, X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import axios from "axios";
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

const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "sip-fas");
    formData.append("folder", "laporan-fasilitas"); 
    
    // DEBUG: Cek apakah preset ada
    console.log("Upload preset:", "ml_default");
    
    try {
        console.log("Uploading file:", file.name, file.size, file.type);
        
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dlwfk4gly'}/image/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        const data = await response.json();
        console.log("Response data:", data); // Debug response
        
        if (!response.ok) {
            console.error("Cloudinary error:", data);
            throw new Error(
                data.error?.message || `Upload failed: ${response.statusText}`
            );
        }

        console.log("Upload success:", data.secure_url);
        return data.secure_url;
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        throw new Error(`Gagal upload foto: ${error.message}`);
    }
};

const LaporPage = () => {
    const [formData, setFormData] = useState({
        judul: "",
        lokasi: "",
        deskripsi: "",
    });
    const [photos, setPhotos] = useState([]);
    const [mapCenter, setMapCenter] = useState({ lat: -7.2575, lng: 112.7521 }); // Default Surabaya
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [isDragOver, setIsDragOver] = useState(false);
    const [showCameraModal, setShowCameraModal] = useState(false);
    
    // ✅ State baru untuk geocoding
    const [geocodeError, setGeocodeError] = useState(null);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    // ✅ GUNAKAN isLoggedIn DARI CONTEXT
    const { isLoggedIn, user } = useAuth();

    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // Batas map hanya dikota Surabaya
    const surabayaBounds = L.latLngBounds(
        L.latLng(-7.37, 112.55), // barat daya (SW)
        L.latLng(-7.18, 112.85) // timur laut (NE)
    );

    useEffect(() => {
        if (isLoggedIn && user) {
            setFormData((prev) => ({
                ...prev,
                pelapor_nama: user.name || "",
                pelapor_email: user.email || "",
            }));
        }
    }, [isLoggedIn, user]);

    // Auto geser setelah user menginput alamat/lokasi
    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (formData.lokasi.trim().length > 3 && isLoggedIn) {
                setGeocodeError(null);
                setIsGeocoding(true);
                
                try {
                    console.log('Searching location:', formData.lokasi);
                    
                    const response = await axios.get('/api/geocode/search', {
                        params: {
                            q: `${formData.lokasi} Surabaya`,
                            viewbox: '112.55,-7.18,112.85,-7.37',
                            bounded: 1,
                        },
                        timeout: 5000,
                    });
                    
                    console.log('Geocode response:', response.data);
                    
                    if (response.data && response.data.length > 0 && !response.data.error) {
                        const { lat, lon } = response.data[0];
                        setMapCenter({
                            lat: parseFloat(lat),
                            lng: parseFloat(lon),
                        });
                    } else if (response.data?.error) {
                        setGeocodeError(response.data.error);
                    }
                } catch (error) {
                    console.error("Error fetching location:", error);
                    setGeocodeError("Gagal mencari lokasi. Silakan coba lagi.");
                } finally {
                    setIsGeocoding(false);
                }
            }
        }, 1500); // Debounce 1.5 detik
        
        return () => clearTimeout(timeout);
    }, [formData.lokasi, isLoggedIn]);

    useEffect(() => {
        // Cleanup ketika komponen unmount
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
            // Cleanup URL preview foto
            photos.forEach((photo) => {
                if (photo.preview) {
                    URL.revokeObjectURL(photo.preview);
                }
            });
        };
    }, []);

    // handle perubahan input
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle drag and drop events
    const handleDragOver = (e) => {
        e.preventDefault();
        if (isLoggedIn) {
            setIsDragOver(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);

        if (!isLoggedIn) {
            setShowLoginModal(true);
            return;
        }

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    // Process uploaded files
    const handleFiles = (files) => {
        const imageFiles = files.filter((file) =>
            file.type.startsWith("image/")
        );

        if (imageFiles.length === 0) {
            alert("Hanya file gambar yang diizinkan");
            return;
        }

        const newPhotos = imageFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));

        setPhotos((prev) => [...prev, ...newPhotos]);
    };

    // upload foto dari file input
    const handlePhotoUpload = (e) => {
        if (!isLoggedIn) {
            setShowLoginModal(true);
            return;
        }

        const files = Array.from(e.target.files);
        handleFiles(files);
    };

    // Buka kamera
    const startCamera = async () => {
        if (!isLoggedIn) {
            setShowLoginModal(true);
            return;
        }

        try {
            // Stop camera sebelumnya jika ada
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }

            console.log("Memulai kamera...");

            // Tampilkan modal terlebih dahulu
            setShowCameraModal(true);

            // Constraint sederhana untuk laptop
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            };

            // Coba dengan fallback
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err) {
                console.log(
                    "Constraint pertama gagal, mencoba fallback...",
                    err
                );
                // Fallback ke constraint minimal
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                });
            }

            console.log("Stream berhasil didapat:", stream);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;

                // Pastikan video mulai diputar
                videoRef.current.play().catch((e) => {
                    console.error("Gagal memutar video:", e);
                });
            }
        } catch (error) {
            console.error("Error accessing camera:", error);
            setShowCameraModal(false); // Tutup modal jika gagal
            alert(
                "Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan."
            );
        }
    };

    // Ambil foto dari kamera
    const capturePhoto = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const canvas = document.createElement("canvas");
            const video = videoRef.current;

            // Tunggu sampai video siap
            if (video.readyState < 2) {
                alert("Kamera belum siap. Tunggu sebentar.");
                return;
            }

            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;

            const context = canvas.getContext("2d");

            // Untuk kamera laptop, mirror secara manual
            context.save();
            context.scale(-1, 1);
            context.drawImage(
                video,
                -canvas.width,
                0,
                canvas.width,
                canvas.height
            );
            context.restore();

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        alert("Gagal mengambil foto. Coba lagi.");
                        return;
                    }

                    const file = new File(
                        [blob],
                        `camera-photo-${Date.now()}.jpg`,
                        {
                            type: "image/jpeg",
                        }
                    );

                    const newPhoto = {
                        file,
                        preview: URL.createObjectURL(blob),
                    };

                    setPhotos((prev) => [...prev, newPhoto]);
                    stopCamera();
                    setShowCameraModal(false);
                },
                "image/jpeg",
                0.85
            );
        } else {
            alert("Kamera belum siap. Tunggu sebentar.");
        }
    };

    // Stop kamera
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
                track.stop();
            });
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    // Tutup modal kamera
    const closeCameraModal = () => {
        stopCamera();
        setShowCameraModal(false);
    };

    // Hapus foto
    const removePhoto = (index) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    // Tambahkan fungsi untuk mengecek kamera yang tersedia
    const checkAvailableCameras = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(
                (device) => device.kind === "videoinput"
            );
            console.log("Kamera yang tersedia:", videoDevices);
            return videoDevices;
        } catch (error) {
            console.error("Error enumerating devices:", error);
            return [];
        }
    };

    // Panggil di useEffect awal
    useEffect(() => {
        if (isLoggedIn) {
            checkAvailableCameras();
        }
    }, [isLoggedIn]);

    // Handle video events
    useEffect(() => {
        if (!videoRef.current) return;

        const video = videoRef.current;

        const handleCanPlay = () => {
            console.log("Video bisa diputar");
        };

        const handleLoadedMetadata = () => {
            console.log("Metadata video dimuat");
        };

        video.addEventListener("canplay", handleCanPlay);
        video.addEventListener("loadedmetadata", handleLoadedMetadata);

        return () => {
            video.removeEventListener("canplay", handleCanPlay);
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        };
    }, [showCameraModal]);

    // gunakan lokasi user
    const handleUseMyLocation = () => {
        if (!isLoggedIn) {
            setShowLoginModal(true);
            return;
        }

        setIsGettingLocation(true);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;

                    // Pastikan lokasi di Surabaya
                    if (!surabayaBounds.contains([latitude, longitude])) {
                        alert("Lokasi Anda di luar area Surabaya!");
                        setIsGettingLocation(false);
                        return;
                    }

                    // Update map center
                    setMapCenter({ lat: latitude, lng: longitude });
                    
                    // Reverse geocoding untuk dapatkan alamat
                    try {
                        const response = await axios.get('/api/geocode/reverse', {
                            params: {
                                lat: latitude,
                                lng: longitude
                            },
                            timeout: 5000
                        });
                        
                        if (response.data && response.data.display_name) {
                            setFormData(prev => ({
                                ...prev,
                                lokasi: response.data.display_name
                            }));
                        } else {
                            setFormData(prev => ({
                                ...prev,
                                lokasi: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                            }));
                        }
                    } catch (error) {
                        console.error("Reverse geocode error:", error);
                        // Fallback ke koordinat
                        setFormData(prev => ({
                            ...prev,
                            lokasi: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                        }));
                    } finally {
                        setIsGettingLocation(false);
                    }
                },
                (error) => {
                    console.error("Error getting location:", error);
                    let errorMessage = "Tidak dapat mengakses lokasi Anda";
                    
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = "Izin lokasi ditolak. Silakan aktifkan di pengaturan browser.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = "Informasi lokasi tidak tersedia.";
                            break;
                        case error.TIMEOUT:
                            errorMessage = "Permintaan lokasi timeout.";
                            break;
                    }
                    
                    alert(errorMessage);
                    setIsGettingLocation(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            alert("Browser Anda tidak mendukung geolokasi");
            setIsGettingLocation(false);
        }
    };

    // Upload semua foto ke Cloudinary
    const uploadAllPhotos = async () => {
        const uploadPromises = photos.map(async (photo) => {
            try {
                return await uploadToCloudinary(photo.file);
            } catch (error) {
                console.error("Error uploading photo:", error);
                throw new Error(`Gagal upload foto: ${error.message}`);
            }
        });

        return await Promise.all(uploadPromises);
    };

    // kirim laporan ke backend Laravel dengan axios
    const handleSubmit = async () => {
        if (!isLoggedIn) {
            setShowLoginModal(true);
            return;
        }

        // Validasi form
        if (
            !formData.judul ||
            !formData.lokasi ||
            !formData.deskripsi ||
            !formData.pelapor_nama
        ) {
            alert("Mohon lengkapi semua field yang wajib diisi (*)");
            return;
        }

        if (photos.length === 0) {
            alert("Mohon upload minimal satu foto");
            return;
        }

        setIsSubmitting(true);
        setMessage("");

        try {
            // Upload semua foto ke Cloudinary
            const photoUrls = await uploadAllPhotos();

            // ✅ Field sudah sesuai dengan database
            const laporanData = {
                judul: formData.judul,
                lokasi: formData.lokasi,
                deskripsi: formData.deskripsi,
                pelapor_nama: formData.pelapor_nama,
                pelapor_email: formData.pelapor_email || "",
                pelapor_telepon: formData.pelapor_telepon || "",
                foto_laporan: photoUrls,
                status: "Validasi",
                user_id: user?.id || null,
            };

            console.log("Data yang dikirim ke backend:", laporanData); // Debug

            const response = await axios.post(
                "http://localhost:8000/api/laporan",
                laporanData,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    timeout: 10000,
                }
            );

            setMessage(
                "success:Laporan berhasil dikirim! Tim kami akan segera menindaklanjuti."
            );

            // Reset form
            setFormData({
                judul: "",
                lokasi: "",
                deskripsi: "",
                pelapor_nama: user?.name || "",
                pelapor_email: user?.email || "",
                pelapor_telepon: "",
            });
            setPhotos([]);
        } catch (error) {
            console.error("Full error response:", error.response?.data); // Debug detail
            console.error("Error details:", error);

            if (error.response) {
                // Server responded with error status
                const errorMsg =
                    error.response.data?.error ||
                    error.response.data?.message ||
                    JSON.stringify(error.response.data);
                setMessage(`error:${errorMsg}`);
            } else if (error.request) {
                // No response received
                setMessage(
                    "error:Tidak ada respon dari server. Periksa koneksi internet."
                );
            } else {
                // Other errors
                setMessage(`error:${error.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle click pada form fields untuk guest
    const handleGuestInteraction = () => {
        if (!isLoggedIn) {
            setShowLoginModal(true);
        }
    };

    const [messageType, messageText] = message.split(":");

    return (
        <>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="bg-slate-700 text-white rounded-t-lg p-6">
                        <h1 className="text-2xl font-bold">
                            Buat Laporan Baru
                        </h1>
                        <p className="text-slate-200 text-sm mt-1">
                            Laporkan kerusakan fasilitas umum di sekitar anda
                        </p>
                    </div>

                    <div className="bg-white rounded-b-lg shadow-lg p-6 space-y-6">
                        {/* Alert Status Pengiriman */}
                        {message && (
                            <Alert
                                className={
                                    messageType === "success"
                                        ? "bg-green-50 border-green-200"
                                        : "bg-red-50 border-red-200"
                                }
                            >
                                <Info
                                    className={`w-4 h-4 ${
                                        messageType === "success"
                                            ? "text-green-600"
                                            : "text-red-600"
                                    }`}
                                />
                                <AlertDescription
                                    className={`text-sm ${
                                        messageType === "success"
                                            ? "text-green-800"
                                            : "text-red-800"
                                    }`}
                                >
                                    {messageText}
                                </AlertDescription>
                            </Alert>
                        )}

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
                                            <Button
                                                variant="outline" 
                                                className="text-xs py-1 h-auto cursor-pointer"
                                            >
                                                <UserPlus className="w-3 h-3 mr-1" />
                                                Daftar
                                            </Button>
                                        </Link>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Informasi Pelapor */}
                        {isLoggedIn && (
                            <div className="border-b pb-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">
                                Informasi Pelapor
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Pelapor
                                    </label>
                                    <div className="p-2 bg-gray-100 rounded border border-gray-300 text-gray-800">
                                    {user?.name || "-"}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                    </label>
                                    <div className="p-2 bg-gray-100 rounded border border-gray-300 text-gray-800 overflow-hidden">
                                    {user?.email || "-"}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nomor Telepon
                                    </label>
                                    <div className="p-2 bg-gray-100 rounded border border-gray-300 text-gray-800">
                                    {user?.phone || "-"}
                                    </div>
                                </div>
                                </div>
                            </div>
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
                                Lokasi <span className="text-red-500">*</span>
                            </label>
                            <Input
                                name="lokasi"
                                value={formData.lokasi}
                                onChange={handleInputChange}
                                placeholder="Contoh : Jalan Patemon Kuburan, Surabaya"
                                className="w-full"
                                disabled={!isLoggedIn}
                            />
                            
                            {/* Geocoding status */}
                            {isGeocoding && (
                                <div className="text-xs text-blue-600 mt-1 flex items-center">
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Mencari lokasi...
                                </div>
                            )}
                            
                            {geocodeError && (
                                <div className="text-xs text-red-600 mt-1 flex items-center">
                                    <Info className="w-3 h-3 mr-1" />
                                    {geocodeError}
                                </div>
                            )}
                        </div>

                        {/* Deskripsi */}
                        <div onClick={handleGuestInteraction}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Deskripsi <span className="text-red-500">*</span>
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

                        {/* Foto Fasilitas dengan Drag & Drop */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Foto fasilitas <span className="text-red-500">*</span>
                            </label>

                            {/* Tombol Pilihan Upload */}
                            <div className="flex gap-3 mb-4">
                                <Button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={!isLoggedIn}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-50"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Pilih dari Galeri
                                </Button>

                                <Button
                                    type="button"
                                    onClick={startCamera}
                                    disabled={!isLoggedIn}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white cursor-pointer disabled:opacity-50"
                                >
                                    <Camera className="w-4 h-4 mr-2" />
                                    Ambil Foto
                                </Button>
                            </div>

                            {/* Area Drag & Drop */}
                            <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                                    isDragOver
                                        ? "border-blue-500 bg-blue-50"
                                        : isLoggedIn
                                        ? "border-gray-300 hover:border-gray-400 bg-gray-50"
                                        : "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
                                }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={handleGuestInteraction}
                            >
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                    ref={fileInputRef}
                                    disabled={!isLoggedIn}
                                />

                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                        <Camera className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">
                                        Drag & drop gambar disini
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        atau klik untuk memilih file
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        PNG, JPG, JPEG hingga 10MB
                                    </p>
                                </div>
                            </div>

                            {/* Preview Foto */}
                            {photos.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                        Foto yang diupload ({photos.length})
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {photos.map((photo, index) => (
                                            <div
                                                key={index}
                                                className="relative group"
                                            >
                                                <img
                                                    src={photo.preview}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-24 object-cover rounded-lg"
                                                />
                                                <button
                                                    onClick={() => removePhoto(index)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
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
                                <ChangeMapView
                                    coords={[mapCenter.lat, mapCenter.lng]}
                                />
                            </MapContainer>

                            <Button
                                onClick={handleUseMyLocation}
                                disabled={!isLoggedIn || isGettingLocation}
                                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGettingLocation ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Mendapatkan lokasi...
                                    </>
                                ) : (
                                    <>
                                        <MapPin className="w-4 h-4 mr-2" />
                                        Gunakan Lokasi Saya
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Tips */}
                        <Alert className="bg-blue-50 border-blue-200">
                            <Info className="w-4 h-4 text-blue-600" />
                            <AlertDescription className="text-sm text-blue-800">
                                <p className="font-medium mb-2">
                                    Tips laporan yang baik
                                </p>
                                <ol className="list-decimal list-inside space-y-1 text-xs">
                                    <li>
                                        Ambil foto yang jelas dan menunjukkan kerusakan fasilitas
                                    </li>
                                    <li>
                                        Gunakan fitur kamera untuk mengambil foto langsung di lokasi
                                    </li>
                                    <li>
                                        Berikan deskripsi yang detail dan spesifik
                                    </li>
                                    <li>
                                        Cantumkan alamat dan gunakan fitur "Gunakan Lokasi Saya"
                                    </li>
                                    <li>
                                        Pastikan informasi pelapor lengkap untuk follow-up
                                    </li>
                                </ol>
                            </AlertDescription>
                        </Alert>

                        {/* Tombol Submit */}
                        <Button
                            onClick={handleSubmit}
                            disabled={!isLoggedIn || isSubmitting}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold py-6 text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Mengirim...
                                </>
                            ) : (
                                <>
                                    <Info className="w-5 h-5 mr-2" />
                                    {isLoggedIn ? "Kirim Laporan" : "Login untuk Melaporkan"}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
            <Footer />

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                            <Link
                                to="/LoginPage"
                                onClick={() => setShowLoginModal(false)}
                            >
                                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 cursor-pointer">
                                    <LogIn className="w-4 h-4 mr-2" />
                                    Login ke Akun
                                </Button>
                            </Link>

                            <Link
                                to="/SignUpPage"
                                onClick={() => setShowLoginModal(false)}
                            >
                                <Button
                                    variant="outline"
                                    className="w-full font-medium py-3 cursor-pointer"
                                >
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

            {/* Camera Modal */}
            {showCameraModal && (
                <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Ambil Foto
                            </h3>
                            <button
                                onClick={closeCameraModal}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                type="button"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-black rounded-lg overflow-hidden mb-4 relative min-h-64">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-64 object-cover"
                                style={{ transform: "scaleX(-1)" }}
                                onLoadedData={() => console.log("Video data loaded")}
                                onCanPlay={() => console.log("Video can play")}
                            />

                            {/* Loading indicator */}
                            {videoRef.current &&
                                videoRef.current.readyState < videoRef.current.HAVE_ENOUGH_DATA && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                                        <div className="text-white text-sm">
                                            Memuat kamera...
                                        </div>
                                    </div>
                                )}
                        </div>

                        <div className="flex justify-center space-x-4">
                            <Button
                                onClick={capturePhoto}
                                className="bg-red-500 hover:bg-red-600 text-white font-medium cursor-pointer"
                                type="button"
                                disabled={
                                    videoRef.current?.readyState < videoRef.current?.HAVE_ENOUGH_DATA
                                }
                            >
                                <Camera className="w-4 h-4 mr-2" />
                                Ambil Foto
                            </Button>

                            <Button
                                onClick={closeCameraModal}
                                variant="outline"
                                className="cursor-pointer"
                                type="button"
                            >
                                Batal
                            </Button>
                        </div>

                        <p className="text-xs text-gray-500 text-center mt-3">
                            Pastikan foto jelas menunjukkan kondisi fasilitas
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

export default LaporPage;