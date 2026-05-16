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
        <div className="space-y-8">
            <div className="bg-[#1E293B] text-white rounded-2xl p-8 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                    <div>
                        <h1 className="text-3xl font-extrabold mb-1 tracking-tight">Selamat Datang, Admin</h1>
                        <p className="text-slate-300 text-sm font-medium">Kelola laporan fasilitas umum Kota Surabaya dengan cepat dan mudah.</p>
                    </div>
                    <button
                        onClick={fetchLaporanData}
                        disabled={isLoading}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 disabled:opacity-50 flex items-center space-x-2 backdrop-blur-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                        <span>Perbarui Data</span>
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
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-3xl font-extrabold text-slate-800 mb-1">{statsData.total}</div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Laporan</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-3xl font-extrabold text-emerald-600 mb-1">{statsData.validated}</div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tervalidasi</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-3xl font-extrabold text-[#FDBD59] mb-1">{statsData.inProgress}</div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dalam Proses</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-3xl font-extrabold text-blue-600 mb-1">{statsData.completed}</div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Selesai</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-3xl font-extrabold text-gray-700 mb-1">{statsData.waiting}</div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Menunggu</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-3xl font-extrabold text-red-600 mb-1">{statsData.rejected}</div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ditolak</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Laporan per Wilayah</h3>
                            <div className="space-y-3">
                                {wilayahData.map((wilayah, index) => (
                                    <div key={index} className="flex justify-between items-center py-3 px-4 hover:bg-slate-50 rounded-xl transition-colors">
                                        <span className="text-sm font-medium text-slate-700">{wilayah.name}</span>
                                        <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full text-xs">{wilayah.laporan}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Aktivitas Terbaru</h3>
                            <div className="space-y-5">
                                {recentActivities.map((activity, index) => (
                                    <div key={index} className="flex items-start space-x-4">
                                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                                            activity.type.includes("baru") ? "bg-emerald-500" : 
                                            activity.type.includes("validasi") ? "bg-blue-500" : "bg-[#FDBD59]"
                                        }`}></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-800">{activity.type}</p>
                                            <p className="text-sm text-slate-600 leading-snug mt-0.5">{activity.description}</p>
                                            <p className="text-xs font-medium text-slate-400 mt-1.5">{activity.time}</p>
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