import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./components/layout/AdminHeader";
import AdminSidebar from "./components/layout/AdminSidebar";
import NotificationPopup from "./components/layout/NotificationPopup";
import DashboardPage from "./components/pages/DashboardPage";
import DataLaporanPage from "./components/pages/DataLaporanPage";
import DataPetugasPage from "./components/pages/DataPetugasPage";
import ProfilPage from "./components/pages/ProfilPage";
import PengaturanPage from "./components/pages/PengaturanPage";
import { useLaporanData } from "./hooks/useLaporanData";
import { usePetugasData } from "./hooks/usePetugasData";
import { useNotification } from "./hooks/useNotification";

export default function DashboardAdminMain() {
    const [activePage, setActivePage] = useState("dashboard");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    // Custom hooks
    const { laporanData, statsData, wilayahData, recentActivities, isLoading, fetchLaporanData } = useLaporanData();
    const { petugasData, fetchPetugasData } = usePetugasData();
    const { notification, showNotification } = useNotification();

    // Fungsi Logout
    const handleLogout = () => {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        navigate("/admin/LoginAdmin");
    };

    // Render active page
    const renderActivePage = () => {
        const pageProps = {
            laporanData,
            statsData,
            wilayahData,
            recentActivities,
            isLoading,
            fetchLaporanData,
            petugasData,
            fetchPetugasData,
            showNotification
        };

        switch (activePage) {
            case "dashboard":
                return <DashboardPage {...pageProps} />;
            case "laporan":
                return <DataLaporanPage {...pageProps} />;
            case "petugas":
                return <DataPetugasPage {...pageProps} />;
            case "profil":
                return <ProfilPage {...pageProps} />;
            case "pengaturan":
                return <PengaturanPage {...pageProps} />;
            default:
                return <DashboardPage {...pageProps} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminHeader 
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                onLogout={handleLogout}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <AdminSidebar 
                        activePage={activePage}
                        setActivePage={setActivePage}
                        isMobileMenuOpen={isMobileMenuOpen}
                    />
                    
                    <div className="flex-1 min-w-0">
                        {renderActivePage()}
                    </div>
                </div>
            </div>

            <NotificationPopup 
                notification={notification}
            />
        </div>
    );
}