import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AdminAuthProvider, useAdminAuth } from "./contexts/AdminAuthContext"; 
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUpPage";
import Statistik from "./components/Statistik";
import LaporPage from "./components/LaporPage";
import ProfilePage from "./components/ProfilePage";
import ForgotPasswordPage from "./components/ForgotPassword";
import ResetPasswordPage from "./components/ResetPasswordPage";
import VerifyCodePage from "./components/VerifyCodePage";
import KontakPage from "./components/KontakPage";
import NavbarBeforeLogin from "./components/NavbarBeforeLogin";
import NavbarAfterLogin from "./components/NavbarAfterLogin";
import LoginAdmin from "./components/LoginAdmin";
import DashboardAdmin from "./components/DashboardAdmin";
import NotFoundPage from "./components/NotFoundPage";

// Komponen wrapper untuk conditional navbar
function AppLayout() {
  const { isLoggedIn, loading } = useAuth();
  const { isAdminLoggedIn } = useAdminAuth(); 
  const location = useLocation();
  
  // Route yang TIDAK butuh navbar public
  const noNavbarRoutes = ['/LoginAdmin', '/DashboardAdmin'];
  const shouldShowNavbar = !noNavbarRoutes.includes(location.pathname);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FDBD59] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {shouldShowNavbar && (isLoggedIn ? <NavbarAfterLogin /> : <NavbarBeforeLogin />)}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/LoginPage" element={<LoginPage />} />
        <Route path="/SignUpPage" element={<SignUpPage />} />
        <Route path="/Statistik" element={<Statistik />} />
        <Route path="/LaporPage" element={<LaporPage />} />
        <Route path="/ProfilePage" element={<ProfilePage />} />
        <Route path="/ForgotPassword" element={<ForgotPasswordPage />} />
        <Route path="/ResetPasswordPage" element={<ResetPasswordPage />} />
        <Route path="/VerifyCodePage" element={<VerifyCodePage />} />
        <Route path="/KontakPage" element={<KontakPage />} />
        <Route path="/LoginAdmin" element={<LoginAdmin />} />
        <Route path="/DashboardAdmin" element={<DashboardAdmin />} />
        
        {/* Catch-all Route - HARUS di paling bawah */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <AdminAuthProvider> {/* ✅ Tambahkan AdminAuthProvider */}
            <AppLayout />
          </AdminAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);