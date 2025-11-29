import React, { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import PetugasModal from "../modals/PetugasModal";
import axios from "axios";

export default function DataPetugasPage({ 
    petugasData, 
    fetchPetugasData, 
    showNotification 
}) {
    const [showPetugasModal, setShowPetugasModal] = useState(false);
    const [formPetugas, setFormPetugas] = useState({
        nama: "",
        alamat: "",
        nomor_telepon: "",
        status: "Aktif",
    });
    const [isEditingPetugas, setIsEditingPetugas] = useState(false);
    const [editingPetugasId, setEditingPetugasId] = useState(null);

    const handleEditPetugas = (petugas) => {
        setFormPetugas({
            nama: petugas.nama,
            alamat: petugas.alamat,
            nomor_telepon: petugas.nomor_telepon,
            status: petugas.status,
        });
        setIsEditingPetugas(true);
        setEditingPetugasId(petugas.id);
        setShowPetugasModal(true);
    };

    const handleDeletePetugas = async (petugasId) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus petugas ini?")) return;

        try {
            const token = localStorage.getItem("admin_token");
            const response = await axios.delete(
                `http://localhost:8000/api/admin/petugas/${petugasId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                showNotification("Petugas berhasil dihapus", "success");
                fetchPetugasData();
            }
        } catch (error) {
            console.error("Error deleting petugas:", error);
            const errorMessage = error.response?.data?.message || "Gagal menghapus petugas";
            showNotification(errorMessage, "error");
        }
    };

    const handleSubmitPetugas = async () => {
        try {
            const token = localStorage.getItem("admin_token");
            const url = isEditingPetugas
                ? `http://localhost:8000/api/admin/petugas/${editingPetugasId}`
                : "http://localhost:8000/api/admin/petugas";

            const method = isEditingPetugas ? "put" : "post";
            const response = await axios[method](url, formPetugas, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
            });

            if (response.data.success) {
                showNotification(
                    isEditingPetugas ? "Petugas berhasil diupdate" : "Petugas berhasil ditambahkan",
                    "success"
                );
                setShowPetugasModal(false);
                resetFormPetugas();
                fetchPetugasData();
            }
        } catch (error) {
            console.error("Error submitting petugas:", error);
            showNotification("Gagal menyimpan data petugas", "error");
        }
    };

    const resetFormPetugas = () => {
        setFormPetugas({ nama: "", alamat: "", nomor_telepon: "", status: "Aktif" });
        setIsEditingPetugas(false);
        setEditingPetugasId(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Data Petugas</h1>
                    <p className="text-gray-600">Kelola petugas lapangan</p>
                </div>
                <button
                    onClick={() => setShowPetugasModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors flex items-center space-x-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Petugas</span>
                </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NAMA</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ALAMAT</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NOMOR TELEPON</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STATUS</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AKSI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {petugasData.map((petugas) => (
                                <tr key={petugas.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{petugas.nama}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{petugas.alamat}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{petugas.nomor_telepon}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            petugas.status === "Aktif" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                        }`}>
                                            {petugas.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEditPetugas(petugas)}
                                                className="text-blue-600 hover:text-blue-900 text-sm font-medium cursor-pointer flex items-center"
                                            >
                                                <Edit className="w-4 h-4 mr-1" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeletePetugas(petugas.id)}
                                                className="text-red-600 hover:text-red-900 text-sm font-medium cursor-pointer flex items-center"
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" />
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <PetugasModal
                showPetugasModal={showPetugasModal}
                setShowPetugasModal={setShowPetugasModal}
                formPetugas={formPetugas}
                setFormPetugas={setFormPetugas}
                isEditingPetugas={isEditingPetugas}
                handleSubmitPetugas={handleSubmitPetugas}
                resetFormPetugas={resetFormPetugas}
            />
        </div>
    );
}