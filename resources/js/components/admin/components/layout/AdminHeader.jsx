import React from "react";
import { Building2, LogOut, Menu, X } from "lucide-react";

export default function AdminHeader({ isMobileMenuOpen, setIsMobileMenuOpen, onLogout }) {
    return (
        <header className="bg-white/95 backdrop-blur-sm shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border-b border-gray-100 z-40 sticky top-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-3">
                        <div className="bg-[#FDBD59] p-2 rounded-xl shadow-sm">
                            <Building2 className="w-5 h-5 text-gray-900" />
                        </div>
                        <div>
                            <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">SIP-FAS</h1>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Kota Surabaya</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="hidden md:block text-right border-r border-gray-100 pr-4 mr-2">
                            <p className="text-sm font-semibold text-gray-900">Admin Surabaya</p>
                            <p className="text-xs text-gray-500 font-medium">Administrator</p>
                        </div>

                        <button
                            onClick={onLogout}
                            className="flex items-center space-x-2 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 p-2 md:px-4 md:py-2 rounded-lg transition-all duration-200 cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden md:block text-sm font-semibold">Logout</span>
                        </button>

                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}