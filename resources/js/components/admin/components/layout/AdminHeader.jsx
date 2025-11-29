import React from "react";
import { Building2, LogOut, Menu, X } from "lucide-react";

export default function AdminHeader({ isMobileMenuOpen, setIsMobileMenuOpen, onLogout }) {
    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">SIP-FAS</h1>
                            <p className="text-sm text-gray-500">Kota Surabaya</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="hidden md:block text-right">
                            <p className="text-sm font-medium text-gray-900">Admin Surabaya</p>
                            <p className="text-xs text-gray-500">Administrator</p>
                        </div>

                        <button
                            onClick={onLogout}
                            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 cursor-pointer"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="hidden md:block text-sm font-medium">Logout</span>
                        </button>

                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}