// modals/SimpleReportModal.jsx
import React from "react";
import { X, MapPin, Calendar, Hash, Eye } from "lucide-react";

export default function SimpleReportModal({
    isOpen,
    onClose,
    report,
    onViewFullDetails
}) {
    if (!isOpen || !report) return null;

    const formatDate = (dateString) => {
        const options = { year: "numeric", month: "long", day: "numeric" };
        return new Date(dateString).toLocaleDateString("id-ID", options);
    };

    return (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg relative">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Detail Laporan</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-gray-800">{report.judul}</h4>
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                            <span>{report.lokasi}</span>
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                            <span>{formatDate(report.created_at)}</span>
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                            <Hash className="w-4 h-4 mr-2 text-gray-500" />
                            <span>ID: #{report.id}</span>
                        </div>

                        <div className="pt-2">
                            <p className="text-sm text-gray-700 line-clamp-3">{report.deskripsi}</p>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={() => {
                                    onClose(); // Tutup modal ringkas
                                    onViewFullDetails(report); // Buka modal lengkap
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                            >
                                <Eye className="w-4 h-4" />
                                Detail Laporan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}