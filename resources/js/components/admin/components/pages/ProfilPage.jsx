import React from "react";
import { User } from "lucide-react";

export default function ProfilPage() {
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
        </div>
    );
}