import React from "react";
import { X } from "lucide-react";

export default function PetugasModal({
    showPetugasModal,
    setShowPetugasModal,
    formPetugas,
    setFormPetugas,
    isEditingPetugas,
    handleSubmitPetugas,
    resetFormPetugas
}) {
    if (!showPetugasModal) return null;

    const handleClose = () => {
        setShowPetugasModal(false);
        resetFormPetugas();
    };

    return (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">
                            {isEditingPetugas ? "Edit Petugas" : "Tambah Petugas"}
                        </h2>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmitPetugas();
                    }}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Petugas
                                </label>
                                <input
                                    type="text"
                                    value={formPetugas.nama}
                                    onChange={(e) => setFormPetugas({...formPetugas, nama: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    placeholder="Masukkan nama petugas"
                                    required
                                />
                            </div>

                            {/* Alamat */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Alamat
                                </label>
                                <textarea
                                    value={formPetugas.alamat}
                                    onChange={(e) => setFormPetugas({...formPetugas, alamat: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    placeholder="Masukkan alamat petugas"
                                    rows="3"
                                    required
                                />
                            </div>

                            {/* Nomor Telepon */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nomor Telepon
                                </label>
                                <input
                                    type="tel"
                                    value={formPetugas.nomor_telepon}
                                    onChange={(e) => setFormPetugas({...formPetugas, nomor_telepon: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    placeholder="Masukkan nomor telepon"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Petugas
                                </label>
                                <input
                                    type="email"
                                    value={formPetugas.email}
                                    onChange={(e) => setFormPetugas({...formPetugas, email: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    placeholder="Masukkan email aktif"
                                    required
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={formPetugas.status}
                                    onChange={(e) => setFormPetugas({...formPetugas, status: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm cursor-pointer"
                                >
                                    <option value="Aktif">Aktif</option>
                                    <option value="Nonaktif">Nonaktif</option>
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3 pt-6">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer"
                                >
                                    {isEditingPetugas ? "Update Petugas" : "Tambah Petugas"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}