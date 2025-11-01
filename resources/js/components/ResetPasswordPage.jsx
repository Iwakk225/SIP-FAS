import React, { useState } from "react";
import { Lock, ArrowLeft, CheckCircle, Loader, Mail, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import axios from 'axios';
import Footer from "./Footer";
import NavbarBeforeLogin from "./NavbarBeforeLogin";

export default function ResetPasswordPage() {
  const location = useLocation();
  const { email, code } = location.state || {};
  
  const [formData, setFormData] = useState({
    email: email || '',
    code: code || '',
    password: '',
    password_confirmation: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  // Redirect jika tidak ada email atau code
  React.useEffect(() => {
    if (!email || !code) {
      navigate('/ForgotPasswordPage');
    }
  }, [email, code, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post('/api/reset-password', formData);

      setSuccess(true);
      
      // Redirect ke login setelah 3 detik
      setTimeout(() => {
        navigate('/LoginPage');
      }, 3000);
      
    } catch (error) {
      if (error.response && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response && error.response.data.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Terjadi kesalahan. Silakan coba lagi.' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!email || !code) {
    return null;
  }

  return (
    <>
      <NavbarBeforeLogin />
      
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 py-12">
        <div className="max-w-md w-full">
          {/* Back Button */}
          <Link 
            to="/VerifyCodePage" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-[#FDBD59] mb-6"
            state={{ email: email }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Verifikasi
          </Link>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-[#FDBD59] rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-black" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Reset Kata Sandi
              </h1>
              <p className="text-gray-600 mb-2">
                Buat password baru untuk akun Anda
              </p>
              <div className="flex items-center justify-center text-sm text-gray-500">
                <Mail className="w-4 h-4 mr-1" />
                <span>{email}</span>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-green-800 font-medium">Berhasil!</p>
                  <p className="text-green-700 text-sm mt-1">
                    Password Anda berhasil direset. Anda akan diarahkan ke halaman login dalam 3 detik.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">
                  {errors.general}
                </p>
              </div>
            )}

            {/* Form */}
            {!success && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <input type="hidden" name="email" value={formData.email} />
                <input type="hidden" name="code" value={formData.code} />
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password Baru
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDBD59] focus:border-[#FDBD59]"
                      placeholder="Masukkan password baru"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password[0]}</p>}
                </div>

                <div>
                  <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password_confirmation"
                      name="password_confirmation"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDBD59] focus:border-[#FDBD59]"
                      placeholder="Konfirmasi password baru"
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password_confirmation && <p className="text-red-500 text-sm mt-1">{errors.password_confirmation[0]}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FDBD59] text-black hover:bg-[#fcae3b] py-3 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            )}

            {/* Password Requirements */}
            {!success && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Syarat Password:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Minimal 6 karakter</li>
                  <li>• Gunakan kombinasi huruf dan angka</li>
                  <li>• Hindari password yang mudah ditebak</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}