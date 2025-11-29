import React, { useState } from "react";
import { X, Upload } from "lucide-react";
import axios from "axios";

export default function UploadBuktiModal({ showUploadModal, setShowUploadModal, selectedLaporanForUpload, showNotification }) {
    const [buktiPhotos, setBuktiPhotos] = useState([]);
    const [pdfFile, setPdfFile] = useState(null);

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
                { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
            );

            if (response.data.success) {
                showNotification("Bukti perbaikan berhasil diupload!", "success");
                setShowUploadModal(false);
                setBuktiPhotos([]);
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
                { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
            );

            if (response.data.success) {
                showNotification("Rincian biaya berhasil diupload!", "success");
                setPdfFile(null);
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

    if (!showUploadModal) return null;

    return (
        <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="border-b border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Upload Bukti Perbaikan</h2>
                        <button onClick={handleCloseUploadModal} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">{selectedLaporanForUpload?.judul}</h3>
                        <p className="text-sm text-blue-700">Lokasi: {selectedLaporanForUpload?.lokasi}</p>
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

                        <button
                            onClick={handleUploadBukti}
                            disabled={buktiPhotos.length === 0}
                            className="mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium cursor-pointer transition-colors disabled:opacity-50 flex items-center"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Foto Bukti ({buktiPhotos.length})
                        </button>
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
                                <p className="text-sm text-green-800 font-medium">File terpilih: {pdfFile.name}</p>
                                <p className="text-xs text-green-600">
                                    Size: {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        )}

                        <button
                            onClick={handleUploadRincianBiaya}
                            disabled={!pdfFile}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium cursor-pointer transition-colors disabled:opacity-50 flex items-center"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Rincian Biaya
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}