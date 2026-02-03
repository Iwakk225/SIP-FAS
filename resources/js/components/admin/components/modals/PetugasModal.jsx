import React, { useState } from "react";
import { X, Mail } from "lucide-react"; 

export default function PetugasModal({
    showPetugasModal,
    setShowPetugasModal,
    formPetugas,
    setFormPetugas,
    isEditingPetugas,
    handleSubmitPetugas,
    resetFormPetugas
}) {
    const [isChangingEmail, setIsChangingEmail] = useState(false);
    const [tempEmail, setTempEmail] = useState(formPetugas.email);

    if (!showPetugasModal) return null;

    const handleClose = () => {
        setShowPetugasModal(false);
        resetFormPetugas();
    };

    // ganti email
    const handleEmailChangeClick = () => {
        setTempEmail(formPetugas.email); 
        setIsChangingEmail(true);
    };

    // save email baru`
    const handleSaveNewEmail = () => {
        // Validasi opsional bisa ditambahkan di sini
        if (tempEmail.trim()) {
            setFormPetugas({ ...formPetugas, email: tempEmail });
            setIsChangingEmail(false);
        }
    };

    const handleCancelEmailChange = () => {
        setTempEmail(formPetugas.email); // Kembalikan ke nilai semula
        setIsChangingEmail(false);
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
                                    onChange={(e) => setFormPetugas({ ...formPetugas, nama: e.target.value })}
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
                                    onChange={(e) => setFormPetugas({ ...formPetugas, alamat: e.target.value })}
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
                                    onChange={(e) => setFormPetugas({ ...formPetugas, nomor_telepon: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    placeholder="Masukkan nomor telepon"
                                    required
                                />
                            </div>

                            {/* Email - Dimodifikasi */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Petugas
                                </label>
                                {isChangingEmail ? (
                                    <div className="space-y-2">
                                        <div className="flex">
                                            <input
                                                type="email"
                                                value={tempEmail}
                                                onChange={(e) => setTempEmail(e.target.value)}
                                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Masukkan email baru"
                                            />
                                            <button
                                                type="button" // Tambahkan ini agar tidak submit form
                                                onClick={handleSaveNewEmail}
                                                className="ml-2 px-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                                            >
                                                Simpan
                                            </button>
                                        </div>
                                        <button
                                            type="button" // Tambahkan ini agar tidak submit form
                                            onClick={handleCancelEmailChange}
                                            className="text-sm text-gray-500 hover:text-gray-700 underline"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between bg-gray-50 border border-gray-300 rounded-lg px-3 py-2">
                                        <span className="text-gray-700 truncate">
                                            {formPetugas.email || <span className="italic text-gray-500">Belum diisi</span>}
                                        </span>
                                        <button
                                            type="button" // Tambahkan ini agar tidak submit form
                                            onClick={handleEmailChangeClick}
                                            className="ml-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                                        >
                                            <Mail className="w-4 h-4 mr-1" />
                                            Ganti
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={formPetugas.status}
                                    onChange={(e) => setFormPetugas({ ...formPetugas, status: e.target.value })}
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