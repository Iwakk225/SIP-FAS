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

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
                <div className="flex items-center space-x-4 mb-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                        <button className="text-[#FDBD59] hover:text-yellow-600 text-sm font-semibold cursor-pointer transition-colors">
                            Ubah Foto
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Lengkap</label>
                        <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-slate-900 font-medium">Admin SIP-FAS</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Nomor Telepon</label>
                        <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-slate-900 font-medium">031-1234567</span>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Instansi</label>
                        <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-slate-900 font-medium">Dinas Pekerjaan Umum Kota Surabaya</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end">
                    <button className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-semibold cursor-pointer transition-colors">
                        Simpan Perubahan
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Ganti Password</h2>
                    <p className="text-slate-500 mb-6 text-sm">Untuk keamanan akun, gunakan password yang kuat dan unik.</p>
                    {!showPasswordForm ? (
                        <button
                            onClick={handleRequestCode}
                            disabled={loading}
                            className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white px-6 py-2.5 rounded-xl font-semibold cursor-pointer transition-colors"
                        >
                            {loading ? "Mengirim..." : "Reset Password"}
                        </button>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-5 max-w-md">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Kode OTP</label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FDBD59] focus:border-transparent transition-all"
                                    placeholder="Masukkan kode 6 digit"
                                    maxLength="6"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Password Baru</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FDBD59] focus:border-transparent transition-all"
                                    placeholder="Minimal 6 karakter"
                                    minLength="6"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Konfirmasi Password Baru</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FDBD59] focus:border-transparent transition-all"
                                    placeholder="Ulangi password baru"
                                    minLength="6"
                                    required
                                />
                            </div>
                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white px-6 py-2.5 rounded-xl font-semibold cursor-pointer transition-colors"
                                >
                                    {loading ? "Mengubah..." : "Ubah Password"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordForm(false)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-semibold cursor-pointer transition-colors"
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