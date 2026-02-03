import React, { useState } from "react";
import { User } from "lucide-react";

export default function ProfilPage() {
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleRequestCode = async () => {
        setLoading(true);
        setMessage("");
        try {
            const response = await fetch("/api/admin/request-reset-code", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json();
            if (response.ok) {
                setMessage(data.message);
                setShowPasswordForm(true);
            } else {
                setMessage(data.message || "Gagal mengirim kode");
            }
        } catch (error) {
            setMessage("Terjadi kesalahan");
        }
        setLoading(false);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage("Password konfirmasi tidak cocok");
            return;
        }
        setLoading(true);
        setMessage("");
        try {
            const response = await fetch("/api/admin/reset-password", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    code,
                    password: newPassword,
                    password_confirmation: confirmPassword,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setMessage(data.message);
                setShowPasswordForm(false);
                setCode("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setMessage(data.message || "Gagal mengubah password");
            }
        } catch (error) {
            setMessage("Terjadi kesalahan");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Profil Admin</h1>
                <p className="text-gray-600">Kelola informasi akun administrator</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer">
                            Ubah Foto
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-gray-900">Admin SIP-FAS</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon</label>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-gray-900">031-1234567</span>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Instansi</label>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-gray-900">Dinas Pekerjaan Umum Kota Surabaya</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium cursor-pointer">
                        Simpan Perubahan
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Ganti Password</h2>
                    <p className="text-gray-600 mb-4">Untuk keamanan akun, gunakan password yang kuat dan unik.</p>
                    {!showPasswordForm ? (
                        <button
                            onClick={handleRequestCode}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium cursor-pointer"
                        >
                            {loading ? "Mengirim..." : "Reset Password"}
                        </button>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Kode OTP</label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Masukkan kode 6 digit"
                                    maxLength="6"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Password Baru</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Minimal 6 karakter"
                                    minLength="6"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password Baru</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ulangi password baru"
                                    minLength="6"
                                    required
                                />
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium cursor-pointer"
                                >
                                    {loading ? "Mengubah..." : "Ubah Password"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordForm(false)}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium cursor-pointer"
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    )}
                    {message && (
                        <div className={`mt-4 p-3 rounded-lg ${message.includes("berhasil") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}