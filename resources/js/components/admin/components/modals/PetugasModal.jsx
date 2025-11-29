import React from "react";
import { X } from "lucide-react";

export default function PetugasModal({
    showPetugasModal,
    setShowPetugasModal,
    formPetugas,
    setFormPetugas,
    isEditingPetugas,
    handleSubmitPetugas,
    resetFormPetugas,
}) {
    if (!showPetugasModal) return null;

    return (
        <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
                <div className="border-b border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">
                            {isEditingPetugas ? "Edit Petugas" : "Tambah Petugas"}
                        </h2>
                        <button
                            onClick={() => {
                                setShowPetugasModal(false);
                                resetFormPetugas();
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nama Petugas</label>
                        <input
                            type="text"
                            value={formPetugas.nama}
                            onChange={(e) => setFormPetugas((prev) => ({ ...prev, nama: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Masukkan nama petugas"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
                        <textarea
                            value={formPetugas.alamat}
                            onChange={(e) => setFormPetugas((prev) => ({ ...prev, alamat: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Masukkan alamat petugas"
                            rows="3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon</label>
                        <input
                            type="text"
                            value={formPetugas.nomor_telepon}
                            onChange={(e) => setFormPetugas((prev) => ({ ...prev, nomor_telepon: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Masukkan nomor telepon"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={formPetugas.status}
                            onChange={(e) => setFormPetugas((prev) => ({ ...prev, status: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="Aktif">Aktif</option>
                            <option value="Nonaktif">Nonaktif</option>
                        </select>
                    </div>
                </div>

                <div className="border-t border-gray-200 p-6">
                    <div className="flex space-x-3">
                        <button
                            onClick={() => {
                                setShowPetugasModal(false);
                                resetFormPetugas();
                            }}
                            className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium cursor-pointer transition-colors hover:bg-gray-50"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSubmitPetugas}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium cursor-pointer transition-colors"
                        >
                            {isEditingPetugas ? "Update" : "Simpan"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}