import React, { useState } from "react";
import { Building2, Menu, X, User, LogOut, Bell } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function NavbarAfterLogin() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    // Gunakan auth context
    const { user, logout } = useAuth();

    const navLinks = [
        { name: "Beranda", path: "/" },
        { name: "Statistik", path: "/Statistik" },
        { name: "Status", path: "/StatusPage" },
        { name: "Lapor", path: "/LaporPage" },
        { name: "Kontak", path: "/KontakPage" },
    ];

    const handleLogout = () => {
        logout();
        navigate("/");
        setIsProfileDropdownOpen(false);
        setIsMenuOpen(false);
    };

    return (
        <nav className="w-full bg-white shadow-sm sticky top-0 left-0 z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
                {/* Logo */}
                <Link to="/" className="flex items-center space-x-2">
                    <div className="bg-[#FDBD59] p-2 rounded-lg">
                        <Building2 className="w-6 h-6 text-[#1A1A1A]" />
                    </div>
                    <span className="font-bold text-lg text-[#1A1A1A]">
                        SIP-FAS
                    </span>
                </Link>

                {/* Menu desktop */}
                <div className="hidden md:flex items-center space-x-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={`text-sm font-medium transition-colors ${
                                location.pathname === link.path
                                    ? "text-[#FDBD59]"
                                    : "text-gray-700 hover:text-[#FDBD59]"
                            }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* User Menu desktop */}
                <div className="hidden md:flex items-center space-x-4">
                    {/* Notifikasi */}
                    <button className="relative p-2 text-gray-600 hover:text-[#FDBD59] transition-colors cursor-pointer">
                        <Bell className="w-5 h-5" />
                        {/* <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            
                        </span> */}
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                            className="flex items-center space-x-2 text-gray-700 hover:text-[#FDBD59] transition-colors cursor-pointer"
                        >
                            <div className="w-8 h-8 bg-[#FDBD59] rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-black" />
                            </div>
                            <span className="text-sm font-medium">
                                {user?.name || "User"}
                            </span>
                        </button>

                        {isProfileDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                                <Link
                                    to="/ProfilePage"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => setIsProfileDropdownOpen(false)}
                                >
                                    Profil Saya
                                </Link>
                                <Link
                                    to="/laporan-saya"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => setIsProfileDropdownOpen(false)}
                                >
                                    Laporan Saya
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
                                >
                                    <LogOut className="w-4 h-4 inline mr-2" />
                                    Keluar
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tombol menu mobile */}
                <div className="md:hidden flex items-center space-x-2">
                    <button className="relative p-2 text-gray-600 cursor-pointer">
                        <Bell className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            3
                        </span>
                    </button>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="cursor-pointer"
                    >
                        {isMenuOpen ? (
                            <X className="w-6 h-6 text-gray-800" />
                        ) : (
                            <Menu className="w-6 h-6 text-gray-800" />
                        )}
                    </button>
                </div>
            </div>

            {/* Menu dropdown mobile */}
            {isMenuOpen && (
                <div className="md:hidden bg-white shadow-md border-t">
                    <div className="flex flex-col items-start px-6 py-4 space-y-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={`text-sm font-medium w-full py-2 ${
                                    location.pathname === link.path
                                        ? "text-[#FDBD59]"
                                        : "text-gray-700 hover:text-[#FDBD59]"
                                }`}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {/* User Info Mobile */}
                        <div className="w-full border-t border-gray-200 pt-3 mt-2">
                            <div className="flex items-center space-x-3 mb-3">
                                <div className="w-8 h-8 bg-[#FDBD59] rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-black" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {user?.name || "User"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {user?.email}
                                    </p>
                                </div>
                            </div>

                            <Link
                                to="/ProfilePage"
                                className="block w-full py-2 text-sm text-gray-700 hover:text-[#FDBD59]"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Profil Saya
                            </Link>
                            <Link
                                to="/StatusPage"
                                className="block w-full py-2 text-sm text-gray-700 hover:text-[#FDBD59]"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Laporan Saya
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center w-full text-left py-2 text-sm text-red-600 hover:text-red-700 cursor-pointer"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Keluar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}