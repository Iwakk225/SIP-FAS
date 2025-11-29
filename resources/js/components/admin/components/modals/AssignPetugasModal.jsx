import React from "react";
import { X } from "lucide-react";
import axios from "axios";

export default function AssignPetugasModal({ 
    showAssignPetugasModal, 
    setShowAssignPetugasModal, 
    selectedLaporanForAssign, 
    showNotification 
}) {
    const [petugasData, setPetugasData] = React.useState([]);

    React.useEffect(() => {
        if (showAssignPetugasModal) {
            fetchPetugasData();
        }
    }, [showAssignPetugasModal]);

    const fetchPetugasData = async () => {
        try {
            const token = localStorage.getItem("admin_token");
            const response = await axios.get("http://localhost:8000/api/admin/petugas", {
                headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
            });
            setPetugasData(response.data.data || response.data);
        } catch (error) {
            console.error("Error fetching petugas data:", error);
            showNotification("Gagal memuat data petugas", "error");
        }
    };

    const handleAssignPetugas = async (petugasId) => {
        try {
            const token = localStorage.getItem("admin_token");
            const response = await axios.post(
                "http://localhost:8000/api/admin/petugas/assign-laporan",
                { laporan_id: selectedLaporanForAssign.id, petugas_id: petugasId },
                { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
            );

            if (response.data.success) {
                showNotification("Petugas berhasil ditugaskan ke laporan", "success");
                setShowAssignPetugasModal(false);
            }
        } catch (error) {
            console.error("Error assigning petugas:", error);
            const errorMessage = error.response?.data?.message || "Gagal menugaskan petugas";
            showNotification(errorMessage, "error");
        }
    };

    if (!showAssignPetugasModal || !selectedLaporanForAssign) return null;

    return (
        <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
                <div className="border-b border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Assign Petugas ke Laporan</h2>
                        <button
                            onClick={() => setShowAssignPetugasModal(false)}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="mb-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{selectedLaporanForAssign.judul}</h3>
                        <p className="text-sm text-gray-600">Lokasi: {selectedLaporanForAssign.lokasi}</p>
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {petugasData.length > 0 ? (
                            petugasData.map((petugas) => (
                                <div
                                    key={petugas.id}
                                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    <div>
                                        <h4 className="font-medium text-gray-900">{petugas.nama}</h4>
                                        <p className="text-sm text-gray-600">{petugas.alamat}</p>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                            petugas.status === "Aktif" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                        }`}>
                                            {petugas.status}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleAssignPetugas(petugas.id)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium cursor-pointer transition-colors"
                                    >
                                        Pilih
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4">Tidak ada petugas tersedia</p>
                        )}
                    </div>
                </div>

                <div className="border-t border-gray-200 p-6">
                    <button
                        onClick={() => setShowAssignPetugasModal(false)}
                        className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium cursor-pointer transition-colors hover:bg-gray-50"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}