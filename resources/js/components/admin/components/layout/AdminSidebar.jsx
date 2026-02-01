import React from "react";
import { BarChart3, FileText, Users, User, Settings, Clock } from "lucide-react";

export default function AdminSidebar({ activePage, setActivePage, isMobileMenuOpen }) {
    const menuItems = [
        { id: "dashboard", icon: BarChart3, label: "Dashboard" },
        { id: "laporan", icon: FileText, label: "Data Laporan" },
        { id: "petugas", icon: Users, label: "Data Petugas" },
        { id: "riwayat", icon: Clock, label: "Riwayat Penugasan" },
        { id: "user", icon: User, label: "Data User" },
    ];

    if (!isMobileMenuOpen) {
        return (
            <div className="hidden lg:block lg:w-64 flex-shrink-0">
                <nav className="bg-white rounded-lg border border-gray-200 p-4 sticky top-8">
                    <div className="space-y-2">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActivePage(item.id)}
                                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                                    activePage === item.id
                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                        : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </nav>
            </div>
        );
    }

    return (
        <div className="lg:hidden">
            <nav className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                <div className="space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActivePage(item.id)}
                            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                                activePage === item.id
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : "text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
}