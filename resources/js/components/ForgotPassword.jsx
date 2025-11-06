import React, { useState } from "react";
import { Mail, ArrowLeft, CheckCircle, Loader } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import axios from 'axios';
import Footer from "./Footer";
import NavbarBeforeLogin from "./NavbarBeforeLogin";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setErrors({});
    setSuccess(false);

    try {
      const response = await axios.post('/api/forgot-password', {
        email: email
      });

      // Redirect ke halaman verifikasi kode
      navigate('/VerifyCodePage', { state: { email: email } });
      
    } catch (error) {
      if (error.response && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response && error.response.data.message) {
        setErrors({ email: [error.response.data.message] });
      } else {
        setErrors({ email: ['Terjadi kesalahan. Silakan coba lagi.'] });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 py-12">
        <div className="max-w-md w-full">
          {/* Back Button */}
          <Link 
            to="/login" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-[#FDBD59] mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Login
          </Link>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-[#FDBD59] rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-black" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Lupa Kata Sandi?
              </h1>
              <p className="text-gray-600">
                Masukkan email Anda untuk mendapatkan kode verifikasi reset password
              </p>
            </div>

            {/* Error Message */}
            {errors.email && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">
                  {errors.email[0]}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDBD59] focus:border-[#FDBD59]"
                    placeholder="masukkan email Anda"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FDBD59] text-black hover:bg-[#fcae3b] py-3 rounded-lg font-semibold transition-colors cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Mengirim Kode...
                  </>
                ) : (
                  'Kirim Kode Verifikasi'
                )}
              </Button>
            </form>

            {/* Additional Info */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Ingat kata sandi?{" "}
                <Link 
                  to="/login" 
                  className="text-[#FDBD59] font-medium hover:underline"
                >
                  Masuk di sini
                </Link>
              </p>
            </div>

            {/* Tips */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tips:</strong> Kode verifikasi 6 digit akan dikirim ke email Anda dan berlaku selama 5 menit.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}