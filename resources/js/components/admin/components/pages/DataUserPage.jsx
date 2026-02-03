import React, { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Eye, UserX, UserCheck, Filter } from "lucide-react";
import UserModal from "../modals/UserModal";
import axios from "axios";

export default function DataUserPage({ showNotification }) {
    const [showUserModal, setShowUserModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: "",
        message: "",
        confirmText: "",
        type: "warning",
        onConfirm: () => {}
    });
    
    const [selectedUser, setSelectedUser] = useState(null);
    const [usersData, setUsersData] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    
    const [formUser, setFormUser] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: ""
    });
    const [isEditingUser, setIsEditingUser] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);

    // Fetch data user dari API
    const fetchUsersData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("admin_token");
            const response = await axios.get(
                "http://localhost:8000/api/admin/users",
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            if (response.data.success) {
                setUsersData(response.data.data);
                setFilteredUsers(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            showNotification("Gagal mengambil data user", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsersData();
    }, []);

    // Filter dan search user
    useEffect(() => {
        let result = usersData;

        // Filter berdasarkan status
        if (filterStatus !== "all") {
            result = result.filter(user => {
                if (filterStatus === "active") return user.status === "aktif";
                if (filterStatus === "inactive") return user.status === "nonaktif";
                if (filterStatus === "verified") return user.email_verified_at !== null;
                if (filterStatus === "unverified") return user.email_verified_at === null;
                return true;
            });
        }

        // Filter berdasarkan search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(user => 
                user.name.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term) ||
                (user.phone && user.phone.includes(searchTerm))
            );
        }

        setFilteredUsers(result);
    }, [searchTerm, filterStatus, usersData]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleFilterChange = (e) => {
        setFilterStatus(e.target.value);
    };

    // Format tanggal
    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    // Handle tambah user baru
    const handleAddUser = () => {
        setFormUser({
            name: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: ""
        });
        setIsEditingUser(false);
        setEditingUserId(null);
        setShowUserModal(true);
    };

    // Handle edit user
    const handleEditUser = (user) => {
        setFormUser({
            name: user.name,
            email: user.email,
            phone: user.phone || "",
            password: "",
            confirmPassword: ""
        });
        setIsEditingUser(true);
        setEditingUserId(user.id);
        setShowUserModal(true);
    };

    // Handle view user detail
    const handleViewUser = (user) => {
        setSelectedUser(user);
        setModalConfig({
            title: "Detail User",
            message: "",
            confirmText: "Tutup",
            type: "info",
            onConfirm: () => setShowConfirmModal(false)
        });
        setShowConfirmModal(true);
    };

    // Handle activate/deactivate user
    const handleToggleStatus = (user) => {
        setSelectedUser(user);
        const isActive = user.status === "aktif";
        setModalConfig({
            title: isActive ? "Nonaktifkan User" : "Aktifkan User",
            message: `Apakah Anda yakin ingin ${isActive ? "menonaktifkan" : "mengaktifkan"} user "${user.name}"?`,
            confirmText: isActive ? "Nonaktifkan" : "Aktifkan",
            type: isActive ? "warning" : "success",
            onConfirm: () => handleUpdateUserStatus(user.id, !isActive)
        });
        setShowConfirmModal(true);
    };

    // Handle delete user
    const handleDeleteUser = (user) => {
        setSelectedUser(user);
        setModalConfig({
            title: "Hapus User",
            message: `Apakah Anda yakin ingin menghapus user "${user.name}"? Tindakan ini tidak dapat dibatalkan.`,
            confirmText: "Hapus",
            type: "danger",
            onConfirm: () => handleDeleteUserConfirm(user.id)
        });
        setShowConfirmModal(true);
    };

    // API call untuk update status user
    const handleUpdateUserStatus = async (userId, activate) => {
        try {
            const token = localStorage.getItem("admin_token");
            const response = await axios.put(
                `http://localhost:8000/api/admin/users/${userId}/status`,
                { status: activate ? "aktif" : "nonaktif" },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                showNotification(
                    `User berhasil ${activate ? "diaktifkan" : "dinonaktifkan"}`,
                    "success"
                );
                fetchUsersData();
            }
        } catch (error) {
            console.error("Error updating user status:", error);
            showNotification("Gagal mengupdate status user", "error");
        }
    };

    // API call untuk delete user
    const handleDeleteUserConfirm = async (userId) => {
        try {
            const token = localStorage.getItem("admin_token");
            const response = await axios.delete(
                `http://localhost:8000/api/admin/users/${userId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                showNotification("User berhasil dihapus", "success");
                fetchUsersData();
            }
        } catch (error) {
            console.error("🔥 ERROR DETAILS:");
            console.error("Full error object:", error);
            console.error("Response data:", error.response?.data);
            console.error("Response status:", error.response?.status);
            console.error("Response headers:", error.response?.headers);
            
            // TAMPILKAN DETAIL ERROR DI CONSOLE
            if (error.response?.data) {
                console.error("Error message:", error.response.data.message);
                console.error("Error debug:", error.response.data.debug);
                
                // Tampilkan notifikasi dengan detail error
                let errorMessage = error.response.data.message || "Gagal menghapus user";
                
                // Jika ada debug info, tambahkan ke console
                if (error.response.data.debug) {
                    console.error("Debug info:", error.response.data.debug);
                    errorMessage += " (cek console untuk detail)";
                }
                
                showNotification(errorMessage, "error");
            } else if (error.request) {
                console.error("No response received:", error.request);
                showNotification("Tidak ada response dari server", "error");
            } else {
                console.error("Error setting up request:", error.message);
                showNotification("Error: " + error.message, "error");
            }
        }
    };

    // Handle submit user (create/update)
    const handleSubmitUser = async () => {
        // Validasi password jika membuat user baru
        if (!isEditingUser && formUser.password !== formUser.confirmPassword) {
            showNotification("Password dan konfirmasi password tidak cocok", "error");
            return;
        }

        try {
            const token = localStorage.getItem("admin_token");
            const url = isEditingUser
                ? `http://localhost:8000/api/admin/users/${editingUserId}`
                : "http://localhost:8000/api/admin/users";

            const method = isEditingUser ? "put" : "post";
            
            // Prepare data untuk dikirim
            const userData = {
                name: formUser.name,
                email: formUser.email,
                phone: formUser.phone
            };

            // Tambahkan password hanya jika diisi (untuk edit) atau untuk create
            if (formUser.password) {
                userData.password = formUser.password;
                if (!isEditingUser) {
                    userData.password_confirmation = formUser.confirmPassword;
                }
            }

            const response = await axios[method](url, userData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json" 
                }
            });

            if (response.data.success) {
                showNotification(
                    isEditingUser ? "User berhasil diupdate" : "User berhasil ditambahkan",
                    "success"
                );
                setShowUserModal(false);
                resetFormUser();
                fetchUsersData();
            }
        } catch (error) {
            console.error("Error submitting user:", error);
            const errorMsg = error.response?.data?.message || "Gagal menyimpan data user";
            showNotification(errorMsg, "error");
        }
    };

    const resetFormUser = () => {
        setFormUser({
            name: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: ""
        });
        setIsEditingUser(false);
        setEditingUserId(null);
    };

    // Get status badge color
    const getStatusColor = (status) => {
        if (status === "nonaktif") return "bg-red-100 text-red-800";
        return "bg-green-100 text-green-800";
    };

    // Get status text
    const getStatusText = (user) => {
        if (user.status === "nonaktif") return "Nonaktif";
        return "Aktif";
    };

    // Render loading
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Data User</h1>
                    <p className="text-gray-600">Kelola akun pengguna masyarakat</p>
                </div>
                <button
                    onClick={handleAddUser}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors flex items-center space-x-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah User</span>
                </button>
            </div>

            {/* Filter dan Search */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari nama, email, atau telepon..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Statistik */}
                    <div className="flex items-center justify-start space-x-4">
                        <div className="text-sm">
                            <span className="text-gray-600">Total User:</span>
                            <span className="font-semibold ml-2">{filteredUsers.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabel User */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NAMA</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">EMAIL</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TELEPON</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STATUS</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DIBUAT</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AKSI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {user.phone || "-"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                                                {getStatusText(user)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {formatDate(user.created_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleViewUser(user)}
                                                    className="text-blue-600 hover:text-blue-900 cursor-pointer"
                                                    title="Lihat detail"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="text-green-600 hover:text-green-900 cursor-pointer"
                                                    title="Edit user"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(user)}
                                                    className={user.status === "aktif" 
                                                        ? "text-yellow-600 hover:text-yellow-900 cursor-pointer" 
                                                        : "text-green-600 hover:text-green-900 cursor-pointer"}
                                                    title={user.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}
                                                >
                                                    {user.status === "aktif" ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="text-red-600 hover:text-red-900 cursor-pointer"
                                                    title="Hapus user"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                        {searchTerm || filterStatus !== "all" 
                                            ? "Tidak ada user yang sesuai dengan filter" 
                                            : "Belum ada data user"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Detail User */}
            {showConfirmModal && modalConfig.title === "Detail User" && selectedUser && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">Detail User</h3>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="px-6 py-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Nama Lengkap</label>
                                <p className="mt-1 text-gray-900">{selectedUser.name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Email</label>
                                <p className="mt-1 text-gray-900">{selectedUser.email}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Nomor Telepon</label>
                                <p className="mt-1 text-gray-900">{selectedUser.phone || "-"}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Status Akun</label>
                                    <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedUser.status, selectedUser.email_verified_at)}`}>
                                        {getStatusText(selectedUser)}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Email Terverifikasi</label>
                                    <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        selectedUser.email_verified_at 
                                            ? "bg-green-100 text-green-800" 
                                            : "bg-yellow-100 text-yellow-800"
                                    }`}>
                                        {selectedUser.email_verified_at ? "Ya" : "Tidak"}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Dibuat Pada</label>
                                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.created_at)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Diupdate Pada</label>
                                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.updated_at)}</p>
                                </div>
                            </div>
                            {selectedUser.email_verified_at && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Diverifikasi Pada</label>
                                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.email_verified_at)}</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="px-6 py-4 border-t flex justify-end">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi */}
            {showConfirmModal && modalConfig.title !== "Detail User" && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">{modalConfig.title}</h3>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="px-6 py-6">
                            <p className="text-gray-700">{modalConfig.message}</p>
                        </div>
                        
                        <div className="px-6 py-4 border-t flex justify-end space-x-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium cursor-pointer hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => {
                                    modalConfig.onConfirm();
                                    setShowConfirmModal(false);
                                }}
                                className={`px-4 py-2 rounded-lg font-medium cursor-pointer ${
                                    modalConfig.type === "danger" 
                                        ? "bg-red-600 hover:bg-red-700 text-white" 
                                        : modalConfig.type === "success"
                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                        : "bg-yellow-600 hover:bg-yellow-700 text-white"
                                }`}
                            >
                                {modalConfig.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal User (Tambah/Edit) */}
            <UserModal
                showUserModal={showUserModal}
                setShowUserModal={setShowUserModal}
                formUser={formUser}
                setFormUser={setFormUser}
                isEditingUser={isEditingUser}
                handleSubmitUser={handleSubmitUser}
                resetFormUser={resetFormUser}
            />
        </div>
    );
}