import React from "react";
import { X } from "lucide-react";

export default function UserModal({
    showUserModal,
    setShowUserModal,
    formUser,
    setFormUser,
    isEditingUser,
    handleSubmitUser,
    resetFormUser
}) {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormUser(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleClose = () => {
        setShowUserModal(false);
        resetFormUser();
    };

    return (
        <>
            {showUserModal && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {isEditingUser ? "Edit User" : "Tambah User Baru"}
                            </h3>
                            <button
                                onClick={handleClose}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="px-6 py-6 space-y-4">
                            {/* Nama */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nama Lengkap *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formUser.name}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formUser.email}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            {/* Telepon */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nomor Telepon
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formUser.phone}
                                    onChange={handleChange}
                                    placeholder="0812-3456-7890"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {isEditingUser ? "Password Baru (opsional)" : "Password *"}
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formUser.password}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required={!isEditingUser}
                                    placeholder={isEditingUser ? "Kosongkan jika tidak ingin mengganti" : ""}
                                />
                            </div>

                            {/* Konfirmasi Password (hanya untuk tambah user baru) */}
                            {!isEditingUser && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Konfirmasi Password *
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formUser.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            )}
                        </div>
                        
                        <div className="px-6 py-4 border-t flex justify-end space-x-3">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium cursor-pointer hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSubmitUser}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium cursor-pointer"
                            >
                                {isEditingUser ? "Update" : "Simpan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}