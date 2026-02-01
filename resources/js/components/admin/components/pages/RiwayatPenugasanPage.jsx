import React from "react";
import { Clock, User, FileText, Info } from "lucide-react";

export default function RiwayatPenugasanPage({ riwayatData, loading }) {
    // 🔒 SAFETY: Handle jika riwayatData undefined atau null
    const data = Array.isArray(riwayatData) ? riwayatData : [];

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded"></div>
                                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow flex flex-col items-center justify-center py-12 px-4 text-center">
                <Info className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Tidak ada riwayat penugasan</h3>
                <p className="text-gray-500 mt-2 max-w-md">
                    Semua penugasan petugas ke laporan akan muncul di sini — termasuk yang telah diselesaikan atau dilepas.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Riwayat Penugasan</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Log semua penugasan petugas ke laporan (termasuk yang sudah selesai/dilepas)
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Laporan ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Petugas ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Tugas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catatan</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((log, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <FileText className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-sm font-medium text-blue-600">
                                            #{log.laporan_id}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <User className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-900">
                                            ID: {log.petugas_id}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        log.status_tugas === 'Dikirim'
                                            ? 'bg-blue-100 text-blue-800'
                                        : log.status_tugas === 'Diterima' || log.status_tugas === 'Dalam Pengerjaan'
                                            ? 'bg-yellow-100 text-yellow-800'
                                        : log.status_tugas === 'Selesai'
                                            ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {log.status_tugas || '–'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex items-center">
                                        <Clock className="w-3 h-3 mr-1 text-gray-400" />
                                        {new Date(log.dikirim_pada).toLocaleString('id-ID')}
                                    </div>
                                    {log.selesai_pada && log.status_tugas === 'Selesai' && (
                                        <div className="text-xs mt-1 text-gray-500">
                                            Selesai: {new Date(log.selesai_pada).toLocaleString('id-ID')}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                                    {log.catatan || '–'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}