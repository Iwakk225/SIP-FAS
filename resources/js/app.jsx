import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import axios from "axios";

// Global URL Interceptor to dynamically rewrite http://localhost:8000 requests to the current active host origin
axios.interceptors.request.use((config) => {
  if (config.url && config.url.includes("http://localhost:8000")) {
    config.url = config.url.replace("http://localhost:8000", window.location.origin);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

const originalFetch = window.fetch;
window.fetch = function (input, init) {
  if (typeof input === "string" && input.includes("http://localhost:8000")) {
    input = input.replace("http://localhost:8000", window.location.origin);
  } else if (input instanceof URL && input.href.includes("http://localhost:8000")) {
    input = new URL(input.href.replace("http://localhost:8000", window.location.origin));
  } else if (input && typeof input === "object" && input.url && input.url.includes("http://localhost:8000")) {
    const newUrl = input.url.replace("http://localhost:8000", window.location.origin);
    input = new Request(newUrl, input);
  }
  return originalFetch(input, init);
};

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
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
import LoginAdmin from "./components/admin/LoginAdmin";
import DashboardAdmin from "./components/admin/DashboardAdmin";
import NotFoundPage from "./components/NotFoundPage";
import StatusPage from "./components/StatusPage";

// Komponen wrapper untuk conditional navbar
function AppLayout() {
  const { isLoggedIn, loading } = useAuth();
  const { isAdminLoggedIn } = useAdminAuth(); 
  const location = useLocation();
  
  // ✅ FIX: Pakai startsWith untuk semua route admin
  const isAdminRoute = location.pathname.startsWith('/admin');
  const shouldShowNavbar = !isAdminRoute;
  
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
        {/* User Routes */}
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
        <Route path="/StatusPage" element={<StatusPage />} />
        
        {/* Admin Routes - TIDAK ada navbar */}
        <Route path="/admin/LoginAdmin" element={<LoginAdmin />} />
        <Route path="/admin/DashboardAdmin" element={<DashboardAdmin />} />
        <Route path="/admin" element={<DashboardAdmin />} />
        
        {/* Catch-all Route - HARUS di paling bawah */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <React.StrictMode>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <AdminAuthProvider>
              <AppLayout />
            </AdminAuthProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);