import React, { useState, useEffect } from "react";
import { 
    Building2, Menu, X, User, LogOut, Bell, 
    CheckCircle, Clock, AlertCircle, XCircle, Loader2
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

const showToast = (message, type = "info") => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        type === 'warning' ? 'bg-yellow-500' :
        'bg-blue-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
};

export default function NavbarAfterLogin() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const { user, logout, getToken } = useAuth();

    const navLinks = [
        { name: "Beranda", path: "/" },
        { name: "Statistik", path: "/Statistik" },
        { name: "Status", path: "/StatusPage" },
        { name: "Lapor", path: "/LaporPage" },
        { name: "Kontak", path: "/KontakPage" },
    ];

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const userToken = getToken();
            
            if (!userToken) {
                setLoading(false);
                return;
            }

            const response = await axios.get(
                "http://localhost:8000/api/user/notifications",
                {
                    headers: { 
                        Authorization: `Bearer ${userToken}`,
                        'Accept': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                setNotifications(response.data.data);
                setUnreadCount(response.data.unread_count || 0);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const userToken = getToken();
            
            const response = await axios.post(
                "http://localhost:8000/api/user/notifications/mark-all-read",
                {},
                {
                    headers: { 
                        Authorization: `Bearer ${userToken}`,
                        'Accept': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                showToast("Semua notifikasi ditandai sebagai dibaca", "success");
                setUnreadCount(0);
                setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
                await fetchNotifications();
            }
        } catch (error) {
            console.error("Error marking all as read:", error);
            showToast("Gagal menandai notifikasi", "error");
        }
        setIsNotificationDropdownOpen(false);
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            const userToken = getToken();
            
            const response = await axios.post(
                `http://localhost:8000/api/user/notifications/${notificationId}/read`,
                {},
                {
                    headers: { 
                        Authorization: `Bearer ${userToken}`,
                        'Accept': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                setNotifications(prev => 
                    prev.map(notif => 
                        notif.id === notificationId 
                            ? { ...notif, is_read: true } 
                            : notif
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(() => {
                fetchNotifications();
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        // Disabled auto-mark for testing
        // if (isNotificationDropdownOpen && unreadCount > 0) {
        //     const timer = setTimeout(() => {
        //         console.log('🔔 Auto-mark notifications as read');
        //         handleMarkAllAsRead();
        //     }, 5000);
        //     return () => clearTimeout(timer);
        // }
    }, [isNotificationDropdownOpen, unreadCount]);

    const handleLogout = () => {
        logout();
        navigate("/");
        setIsProfileDropdownOpen(false);
        setIsMenuOpen(false);
    };

    const getStatusIcon = (status) => {
        switch(status?.toLowerCase()) {
            case 'selesai':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'dalam proses':
                return <Clock className="w-4 h-4 text-blue-500" />;
            case 'ditolak':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'validasi':
            case 'tervalidasi':
                return <AlertCircle className="w-4 h-4 text-yellow-500" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffHours < 1) {
            return 'Baru saja';
        } else if (diffHours < 24) {
            return `${diffHours} jam yang lalu`;
        } else {
            return date.toLocaleDateString('id-ID');
        }
    };

    const handleNotificationClick = (notification) => {
        navigate('/StatusPage');
        setIsNotificationDropdownOpen(false);
    };

    // ✅ Komponen reusable untuk avatar
    const Avatar = ({ photoUrl, size = "w-8 h-8" }) => (
        <div className={`${size} rounded-full overflow-hidden border border-gray-200`}>
            {photoUrl ? (
                <img
                    src={photoUrl}
                    alt="Foto Profil"
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full bg-[#FDBD59] flex items-center justify-center">
                    <User className="w-4 h-4 text-black" />
                </div>
            )}
        </div>
    );

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
                {user && (
                    <div className="hidden md:flex items-center space-x-4">
                        {/* Notifikasi */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
                                    setIsProfileDropdownOpen(false);
                                    fetchNotifications();
                                }}
                                className="relative p-2 text-gray-600 hover:text-[#FDBD59] transition-colors cursor-pointer"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {isNotificationDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 max-h-96 overflow-y-auto">
                                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="text-sm font-semibold text-gray-900">
                                            Notifikasi
                                        </h3>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={handleMarkAllAsRead}
                                                className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                                            >
                                                Tandai semua dibaca
                                            </button>
                                        )}
                                    </div>

                                    {loading ? (
                                        <div className="flex justify-center items-center py-8">
                                            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                                        </div>
                                    ) : notifications.length > 0 ? (
                                        <div className="divide-y divide-gray-100">
                                            {notifications.map((notif) => (
                                                <div
                                                    key={notif.id}
                                                    onClick={() => {
                                                        handleNotificationClick(notif);
                                                        handleMarkAsRead(notif.id);
                                                    }}
                                                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                                                        !notif.is_read ? 'bg-blue-50' : ''
                                                    }`}
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        <div className="mt-0.5">
                                                            {getStatusIcon(notif.report?.status)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {notif.report?.judul}
                                                            </p>
                                                            <p className="text-xs text-gray-600 mt-1">
                                                                {notif.message}
                                                            </p>
                                                            <div className="flex justify-between items-center mt-2">
                                                                <p className="text-xs text-gray-400">
                                                                    {formatTime(notif.updated_at)}
                                                                </p>
                                                                {!notif.is_read && (
                                                                    <span className="text-xs text-blue-600 font-medium">
                                                                        Baru
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkAsRead(notif.id);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                                                            title="Tandai dibaca"
                                                        >
                                                            ✓
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="px-4 py-8 text-center">
                                            <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">
                                                Tidak ada notifikasi
                                            </p>
                                        </div>
                                    )}

                                    <div className="border-t border-gray-100 px-4 py-2">
                                        <Link
                                            to="/StatusPage"
                                            onClick={() => setIsNotificationDropdownOpen(false)}
                                            className="text-xs text-center block text-blue-600 hover:text-blue-800"
                                        >
                                            Lihat semua laporan →
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setIsProfileDropdownOpen(!isProfileDropdownOpen);
                                    setIsNotificationDropdownOpen(false);
                                }}
                                className="flex items-center space-x-2 text-gray-700 hover:text-[#FDBD59] transition-colors cursor-pointer"
                            >
                                <Avatar photoUrl={user?.profile_photo_path} />
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
                                        to="/StatusPage"
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
                )}

                {/* Tombol menu mobile */}
                <div className="md:hidden flex items-center space-x-2">
                    {user && (
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
                                    setIsMenuOpen(false);
                                    fetchNotifications();
                                }}
                                className="relative p-2 text-gray-600 hover:text-[#FDBD59] transition-colors cursor-pointer"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}
                    
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

                        {user && (
                            <div className="w-full border-t border-gray-200 pt-3 mt-2">
                                <div className="flex items-center space-x-3 mb-3">
                                    {/* ✅ FOTO PROFIL DI MOBILE */}
                                    <Avatar photoUrl={user?.profile_photo_path} />
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
                        )}
                    </div>
                </div>
            )}

            {/* Notification Dropdown Mobile */}
            {isNotificationDropdownOpen && user && (
                <div className="md:hidden absolute top-16 right-4 w-80 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">
                            Notifikasi
                        </h3>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => {
                                        handleNotificationClick(notif);
                                        handleMarkAsRead(notif.id);
                                        setIsNotificationDropdownOpen(false);
                                    }}
                                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                                        !notif.is_read ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="mt-0.5">
                                            {getStatusIcon(notif.report?.status)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {notif.report?.judul}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {notif.message}
                                            </p>
                                            <div className="flex justify-between items-center mt-2">
                                                <p className="text-xs text-gray-400">
                                                    {formatTime(notif.updated_at)}
                                                </p>
                                                {!notif.is_read && (
                                                    <span className="text-xs text-blue-600 font-medium">
                                                        Baru
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-4 py-8 text-center">
                            <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">
                                Tidak ada notifikasi
                            </p>
                        </div>
                    )}

                    <div className="border-t border-gray-100 px-4 py-2">
                        <Link
                            to="/StatusPage"
                            onClick={() => setIsNotificationDropdownOpen(false)}
                            className="text-xs text-center block text-blue-600 hover:text-blue-800"
                        >
                            Lihat semua laporan →
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}