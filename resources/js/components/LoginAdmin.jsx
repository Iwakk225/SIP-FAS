import React, { useState } from "react";
import { Lock, User, Eye, EyeOff, Building2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../contexts/AdminAuthContext"; 

export default function LoginAdmin() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();
  const { login } = useAdminAuth(); 

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(""); // Clear error ketika user mulai ketik
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/DashboardAdmin');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const fillDemoCredentials = () => {
    setFormData({
      email: "sipfassby@gmail.com",
      password: "admin123"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Side - Branding */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white hidden lg:flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-8">
              <div className="bg-white p-2 rounded-lg">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">SIP-FAS</h1>
                <p className="text-blue-100 text-sm">Sistem Informasi Pelaporan Fasilitas</p>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold mb-4">Admin Portal</h2>
            <p className="text-blue-100 text-lg mb-6">
              Sistem Manajemen Pelaporan Fasilitas Publik Kota Surabaya
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-blue-100">Kelola laporan masyarakat</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-blue-100">Pantau statistik real-time</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-blue-100">Koordinasi dengan dinas terkait</span>
              </div>
            </div>
          </div>
          
          <div className="text-blue-200 text-sm">
            <p>© 2024 Dinas PU Kota Surabaya</p>
            <p>Versi 2.1.0</p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="p-8 lg:p-12">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center space-x-3 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SIP-FAS</h1>
              <p className="text-gray-500 text-sm">Admin Portal</p>
            </div>
          </div>

          <div className="max-w-md mx-auto">
            <div className="text-center lg:text-left mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Login Admin
              </h1>
              <p className="text-gray-600">
                Akses dashboard administrasi sistem
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="email" 
                    name="email" 
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Masukkan email admin"
                    className="pl-10 w-full"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Masukkan password"
                    className="pl-10 pr-10 w-full"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Memproses...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <LogIn className="w-5 h-5" />
                    <span>Masuk sebagai Admin</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Credentials Admin:
              </h3>
              <button
                onClick={fillDemoCredentials}
                className="w-full text-left p-2 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="font-medium text-gray-900">sipfassby@gmail.com</div>
                <div className="text-gray-500">Password: admin123</div>
              </button>
            </div>

            {/* Back to Main Site */}
            <div className="mt-6 text-center">
              <Link
                to="/"
                className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                ← Kembali ke halaman utama
              </Link>
            </div>

            {/* Mobile Footer */}
            <div className="lg:hidden mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                © 2024 Dinas PU Kota Surabaya • SIP-FAS v2.1.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}