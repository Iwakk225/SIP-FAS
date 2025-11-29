import React from "react";
import { RefreshCw } from "lucide-react";

export default function DashboardPage({ 
    statsData, 
    wilayahData, 
    recentActivities, 
    isLoading, 
    fetchLaporanData 
}) {
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">Selamat Datang, Admin</h1>
                        <p className="text-blue-100">Kelola laporan fasilitas Kota Surabaya</p>
                    </div>
                    <button
                        onClick={fetchLaporanData}
                        disabled={isLoading}
                        className="bg-blue-500 hover:bg-blue-400 text-white p-2 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
                    <p className="text-gray-600">Memuat data laporan dari database...</p>
                </div>
            )}

            {!isLoading && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                            <div className="text-2xl font-bold text-gray-900">{statsData.total}</div>
                            <div className="text-sm text-gray-500">Total Laporan</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                            <div className="text-2xl font-bold text-green-600">{statsData.validated}</div>
                            <div className="text-sm text-gray-500">Tervalidasi</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                            <div className="text-2xl font-bold text-yellow-600">{statsData.inProgress}</div>
                            <div className="text-sm text-gray-500">Dalam Proses</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                            <div className="text-2xl font-bold text-blue-600">{statsData.completed}</div>
                            <div className="text-sm text-gray-500">Selesai</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Laporan per Wilayah</h3>
                            <div className="space-y-3">
                                {wilayahData.map((wilayah, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                                        <span className="text-sm text-gray-700">{wilayah.name}</span>
                                        <span className="font-semibold text-gray-900">{wilayah.laporan}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktivitas Terbaru</h3>
                            <div className="space-y-4">
                                {recentActivities.map((activity, index) => (
                                    <div key={index} className="flex items-start space-x-3">
                                        <div className={`w-2 h-2 rounded-full mt-2 ${
                                            activity.type.includes("baru") ? "bg-green-500" : 
                                            activity.type.includes("validasi") ? "bg-blue-500" : "bg-yellow-500"
                                        }`}></div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{activity.type}</p>
                                            <p className="text-sm text-gray-600">{activity.description}</p>
                                            <p className="text-xs text-gray-400">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}