import React, { useState } from "react";
import {
    X,
    Upload,
    FileText,
    Image as ImageIcon,
    Loader2,
    AlertCircle,
} from "lucide-react";
import axios from "axios";

const CLOUDINARY_CLOUD_NAME = "dlwfk4gly";
const CLOUDINARY_UPLOAD_PRESET = "sip-fas";

// Setup axios instance dengan base URL
const api = axios.create({
    baseURL: "http://localhost:8000/api",
    timeout: 60000,
    headers: {
        Accept: "application/json",
    },
});

// Tambahkan interceptor untuk token
api.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem("admin_token") ||
            localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default function UploadBuktiModal({
    showUploadModal,
    setShowUploadModal,
    selectedLaporanForUpload,
    showNotification,
    fetchLaporanData,
    onSuccess,
}) {
    const [buktiPhotos, setBuktiPhotos] = useState([]);
    const [pdfFile, setPdfFile] = useState(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    const compressImage = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const maxWidth = 1024;
                    const maxHeight = 1024;

                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            const compressedFile = new File([blob], file.name, {
                                type: "image/jpeg",
                                lastModified: Date.now(),
                            });

                            const originalSize = (file.size / 1024).toFixed(2);
                            const compressedSize = (blob.size / 1024).toFixed(
                                2
                            );
                            const compressionRatio = (
                                (1 - blob.size / file.size) *
                                100
                            ).toFixed(1);

                            console.log(
                                `Kompresi: ${originalSize}KB → ${compressedSize}KB (${compressionRatio}% lebih kecil)`
                            );

                            resolve({
                                file: compressedFile,
                                originalSize,
                                compressedSize,
                                compressionRatio,
                            });
                        },
                        "image/jpeg",
                        0.7
                    );
                };
                img.onerror = () => reject(new Error("Gagal memuat gambar"));
            };
            reader.onerror = () => reject(new Error("Gagal membaca file"));
        });
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);

        // Filter hanya file gambar dengan format yang valid
        const allowedImageTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
        ];
        const imageFiles = files.filter((file) =>
            allowedImageTypes.includes(file.type)
        );

        if (imageFiles.length === 0) {
            showNotification(
                "Harap upload file gambar dengan format JPEG, JPG, PNG, GIF, atau WebP",
                "error"
            );
            return;
        }

        // Cek ukuran file gambar (maksimal 5MB per file)
        const maxImageSize = 5 * 1024 * 1024; // 5MB
        const oversizedFiles = imageFiles.filter(
            (file) => file.size > maxImageSize
        );
        if (oversizedFiles.length > 0) {
            showNotification(
                `Beberapa file terlalu besar. Maksimal 5MB per file`,
                "error"
            );
            return;
        }

        setIsCompressing(true);
        setUploadError(null);

        try {
            const compressedPhotos = [];

            for (const file of imageFiles) {
                try {
                    const compressed = await compressImage(file);
                    compressedPhotos.push({
                        file: compressed.file,
                        preview: URL.createObjectURL(compressed.file),
                        originalSize: compressed.originalSize,
                        compressedSize: compressed.compressedSize,
                        compressionRatio: compressed.compressionRatio,
                    });
                } catch (error) {
                    console.error("Error compressing file:", file.name, error);
                    showNotification(
                        `Gagal mengkompresi ${file.name}`,
                        "error"
                    );
                }
            }

            if (compressedPhotos.length > 0) {
                setBuktiPhotos((prev) => [...prev, ...compressedPhotos]);
                showNotification(
                    `${compressedPhotos.length} gambar berhasil dikompresi dan siap diupload`,
                    "success"
                );
            }
        } catch (error) {
            console.error("Error compressing images:", error);
            showNotification("Gagal mengkompresi gambar", "error");
        } finally {
            setIsCompressing(false);
        }
    };

    const handlePdfUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validasi hanya PDF
        const allowedPdfTypes = ["application/pdf"];
        const allowedExtensions = [".pdf"];

        // Cek tipe file dan ekstensi
        const isPdfType = allowedPdfTypes.includes(file.type);
        const hasPdfExtension = allowedExtensions.some((ext) =>
            file.name.toLowerCase().endsWith(ext)
        );

        if (!isPdfType && !hasPdfExtension) {
            showNotification("Harap upload file PDF saja (.pdf)", "error");
            e.target.value = "";
            return;
        }

        // Cek ukuran file (maksimal 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            showNotification(
                "Ukuran file terlalu besar. Maksimal 10MB",
                "error"
            );
            e.target.value = "";
            return;
        }

        setPdfFile(file);
        showNotification("File PDF berhasil dipilih", "success");
    };

    const handleUploadBukti = async () => {
        if (!selectedLaporanForUpload?.id) {
            showNotification("ID laporan tidak ditemukan", "error");
            return;
        }

        if (buktiPhotos.length === 0 && !pdfFile) {
            showNotification("Tidak ada file yang diupload", "error");
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            // 1. UPLOAD FOTO KE CLOUDINARY
            const fotoUrls = [];
            for (const photo of buktiPhotos) {
                try {
                    const url = await uploadToCloudinary(
                        photo.file,
                        "admin-bukti-perbaikan/foto-perbaikan"
                    );
                    fotoUrls.push(url);
                    showNotification(
                        `Foto ${photo.file.name} berhasil diupload`,
                        "success"
                    );
                } catch (error) {
                    console.error(`Error uploading ${photo.file.name}:`, error);
                    showNotification(
                        `Gagal upload ${photo.file.name}`,
                        "error"
                    );
                }
            }

            // 2. UPLOAD PDF KE CLOUDINARY
            let pdfUrl = null;
            if (pdfFile) {
                try {
                    pdfUrl = await uploadPdfToCloudinary(pdfFile);
                    showNotification("PDF berhasil diupload", "success");
                } catch (error) {
                    console.error("Error uploading PDF:", error);
                    showNotification("Gagal upload PDF", "error");
                }
            }

            // 3. KIRIM URL KE BACKEND
            if (fotoUrls.length > 0 || pdfUrl) {
                const response = await api.post(
                    `/admin/laporan/${selectedLaporanForUpload.id}/upload-all-bukti`,
                    {
                        foto_bukti_perbaikan: fotoUrls,
                        rincian_biaya_pdf: pdfUrl,
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (response.data.success) {
                    showNotification("✅ Bukti berhasil diupload!", "success");

                    // Panggil callback jika ada
                    if (onSuccess && typeof onSuccess === "function") {
                        onSuccess(selectedLaporanForUpload.id);
                    }

                    handleCloseUploadModal();
                }
            }
        } catch (error) {
            console.error("Upload process error:", error);
            setUploadError(
                error.response?.data?.message ||
                    "Gagal menyimpan bukti perbaikan"
            );
        } finally {
            setIsUploading(false);
        }
    };

    const uploadToCloudinary = async (
        file,
        folder = "admin-bukti-perbaikan"
    ) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "sip-fas"); // SAMA dengan LaporPage
        formData.append("folder", folder);
        formData.append("resource_type", "image");

        console.log("Uploading to Cloudinary:", {
            file: file.name,
            size: file.size,
            type: file.type,
            folder: folder,
        });

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/dlwfk4gly/auto/upload`, // Gunakan auto/upload
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await response.json();
            console.log("Cloudinary Response:", data);

            if (!response.ok) {
                console.error("Cloudinary error:", data);
                throw new Error(
                    data.error?.message ||
                        `Upload failed: ${response.statusText}`
                );
            }

            console.log("Upload success:", data.secure_url);
            return data.secure_url;
        } catch (error) {
            console.error("Error uploading to Cloudinary:", error);
            throw new Error(`Gagal upload: ${error.message}`);
        }
    };

    // Fungsi untuk upload PDF ke Cloudinary (GANTI INI)
    const uploadPdfToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "sip-fas");
        formData.append("folder", "rincian-biaya");
        formData.append("resource_type", "raw"); // 🔥 PENTING: raw untuk PDF

        console.log("Uploading PDF to Cloudinary:", {
            file: file.name,
            size: file.size,
            type: file.type,
        });

        try {
            // 🔥 Ganti endpoint ke raw/upload
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/dlwfk4gly/raw/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await response.json();
            console.log("Cloudinary PDF Response:", data);

            if (!response.ok) {
                throw new Error(data.error?.message || "Upload PDF failed");
            }

            return data.secure_url;
        } catch (error) {
            console.error("PDF upload error:", error);
            throw error;
        }
    };

    const handleCloseUploadModal = () => {
        // Clean up object URLs
        buktiPhotos.forEach((photo) => {
            if (photo.preview && photo.preview.startsWith("blob:")) {
                URL.revokeObjectURL(photo.preview);
            }
        });

        setShowUploadModal(false);
        setBuktiPhotos([]);
        setPdfFile(null);
        setIsCompressing(false);
        setIsUploading(false);
        setUploadError(null);
    };

    if (!showUploadModal) return null;

    return (
        <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="border-b border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">
                            Upload Bukti Perbaikan
                        </h2>
                        <button
                            onClick={handleCloseUploadModal}
                            disabled={isUploading}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Debug Info */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600">
                            <strong>Info Debug:</strong> Laporan ID:{" "}
                            {selectedLaporanForUpload?.id} | Token:{" "}
                            {localStorage.getItem("admin_token") ||
                            localStorage.getItem("token")
                                ? "✓ Ada"
                                : "✗ Tidak ada"}
                        </p>
                        <button
                            onClick={() => {
                                console.log("🔍 Debug Info:", {
                                    laporanId: selectedLaporanForUpload?.id,
                                    token:
                                        localStorage.getItem("admin_token") ||
                                        localStorage.getItem("token"),
                                    photosCount: buktiPhotos.length,
                                    hasPDF: !!pdfFile,
                                });
                            }}
                            className="text-xs text-blue-600 mt-1 hover:underline"
                        >
                            Klik untuk debug di console
                        </button>
                    </div>

                    {/* Error Message */}
                    {uploadError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                                <p className="text-red-800 font-medium">
                                    Error Upload:
                                </p>
                            </div>
                            <p className="text-red-700 text-sm mt-1">
                                {uploadError}
                            </p>
                        </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">
                            {selectedLaporanForUpload?.judul}
                        </h3>
                        <p className="text-sm text-blue-700">
                            Lokasi: {selectedLaporanForUpload?.lokasi}
                        </p>
                        <p className="text-sm text-blue-700">
                            Status: {selectedLaporanForUpload?.status}
                        </p>
                        <p className="text-sm text-blue-700">
                            ID Laporan: {selectedLaporanForUpload?.id}
                        </p>
                    </div>

                    {/* Foto Bukti Perbaikan */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <ImageIcon className="w-5 h-5 mr-2" />
                                Foto Bukti Perbaikan
                            </h3>
                            {isCompressing && (
                                <span className="text-sm text-yellow-600 flex items-center">
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                    Mengkompresi...
                                </span>
                            )}
                        </div>

                        <div className="mb-4">
                            <input
                                type="file"
                                multiple
                                accept=".jpg,.jpeg,.png,.gif,.webp"
                                onChange={handleFileUpload}
                                className="w-full border border-gray-300 rounded-lg p-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isCompressing || isUploading}
                            />
                            <div className="text-xs text-gray-500 mt-1 space-y-1">
                                <p>
                                    • Format yang didukung: JPG, JPEG, PNG, GIF,
                                    WebP
                                </p>
                                <p>• Maksimal 5MB per file</p>
                                <p>
                                    • Gambar akan dikompresi otomatis untuk
                                    memperkecil ukuran
                                </p>
                            </div>
                        </div>

                        {buktiPhotos.length > 0 && (
                            <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-3 gap-3">
                                    {buktiPhotos.map((photo, index) => (
                                        <div
                                            key={index}
                                            className="relative group"
                                        >
                                            <img
                                                src={photo.preview}
                                                alt={`Bukti ${index + 1}`}
                                                className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                            />
                                            <button
                                                onClick={() => {
                                                    if (!isUploading) {
                                                        URL.revokeObjectURL(
                                                            photo.preview
                                                        );
                                                        setBuktiPhotos(
                                                            buktiPhotos.filter(
                                                                (_, i) =>
                                                                    i !== index
                                                            )
                                                        );
                                                    }
                                                }}
                                                disabled={isUploading}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm cursor-pointer hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                ×
                                            </button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 text-center">
                                                {photo.compressedSize}KB
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Info Kompresi */}
                                <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg border border-green-200">
                                    <div className="flex items-center">
                                        <Loader2 className="w-4 h-4 mr-2 text-green-600" />
                                        <span className="font-medium">
                                            Kompresi Aktif
                                        </span>
                                    </div>
                                    {buktiPhotos[0]?.compressionRatio && (
                                        <p className="mt-1 text-green-700">
                                            Gambar dikompresi rata-rata{" "}
                                            {buktiPhotos[0].compressionRatio}%
                                            lebih kecil
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {buktiPhotos.length > 0 && (
                            <button
                                onClick={handleUploadBukti}
                                disabled={isCompressing || isUploading}
                                className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Mengupload...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5 mr-2" />
                                        Upload {buktiPhotos.length} Foto Bukti
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Rincian Biaya PDF */}
                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <FileText className="w-5 h-5 mr-2" />
                            Rincian Biaya (PDF)
                        </h3>
                        <div className="mb-4">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handlePdfUpload}
                                className="w-full border border-gray-300 rounded-lg p-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isUploading}
                            />
                            <div className="text-xs text-gray-500 mt-1 space-y-1">
                                <p>
                                    • Hanya file PDF yang diperbolehkan (.pdf)
                                </p>
                                <p>• Maksimal 10MB</p>
                            </div>
                        </div>

                        {pdfFile && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <FileText className="w-8 h-8 text-blue-600 mr-3" />
                                        <div>
                                            <p className="text-sm text-blue-800 font-medium">
                                                {pdfFile.name}
                                            </p>
                                            <p className="text-xs text-blue-600 mt-1">
                                                Ukuran:{" "}
                                                {(
                                                    pdfFile.size /
                                                    1024 /
                                                    1024
                                                ).toFixed(2)}{" "}
                                                MB
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() =>
                                            !isUploading && setPdfFile(null)
                                        }
                                        disabled={isUploading}
                                        className="text-red-500 hover:text-red-700 cursor-pointer p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {pdfFile && (
                            <button
                                onClick={handleUploadBukti}
                                disabled={isCompressing || isUploading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Mengupload...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5 mr-2" />
                                        Upload Rincian Biaya (PDF)
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Upload All Button */}
                    {(buktiPhotos.length > 0 || pdfFile) && (
                        <div className="pt-6 border-t">
                            <button
                                onClick={handleUploadBukti}
                                disabled={isCompressing || isUploading}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Mengupload...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5 mr-2" />
                                        {buktiPhotos.length > 0 && pdfFile
                                            ? `Upload ${buktiPhotos.length} Foto & PDF`
                                            : buktiPhotos.length > 0
                                            ? `Upload ${buktiPhotos.length} Foto`
                                            : "Upload PDF"}
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Informasi Tambahan */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-900 mb-2">
                            Perhatian:
                        </h4>
                        <ul className="text-sm text-yellow-800 space-y-1">
                            <li>
                                • Foto: Hanya format gambar (JPG, PNG, GIF,
                                WebP)
                            </li>
                            <li>• Dokumen: Hanya format PDF</li>
                            <li>
                                • File yang diupload akan tersimpan secara
                                permanen
                            </li>
                            <li>
                                • Pastikan file yang diupload sesuai dengan
                                bukti perbaikan
                            </li>
                            <li>
                                • Upload mungkin memakan waktu beberapa detik
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
