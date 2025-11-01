import React, { useState, useEffect } from "react";
import { Mail, ArrowLeft, CheckCircle, Loader, Clock } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import axios from 'axios';
import Footer from "./Footer";
import NavbarBeforeLogin from "./NavbarBeforeLogin";

export default function VerifyCodePage() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 menit dalam detik
  const [canResend, setCanResend] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCodeChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto focus ke next input
      if (value && index < 5) {
        document.getElementById(`code-${index + 1}`).focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`).focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      setErrors({ code: ['Kode harus 6 digit'] });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post('/api/verify-reset-code', {
        email: email,
        code: verificationCode
      });

      setSuccess(true);
      
      // Redirect ke reset password page dengan data
      setTimeout(() => {
        navigate('/ResetPasswordPage', { 
          state: { 
            email: email, 
            code: verificationCode
          } 
        });
      }, 1500);
      
    } catch (error) {
      if (error.response && error.response.data.message) {
        setErrors({ code: [error.response.data.message] });
      } else {
        setErrors({ code: ['Terjadi kesalahan. Silakan coba lagi.'] });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setErrors({});

    try {
      await axios.post('/api/forgot-password', { email });
      
      setTimeLeft(300);
      setCanResend(false);
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0').focus();
      
      // Show success message
      setErrors({ success: ['Kode baru telah dikirim!'] });
      
    } catch (error) {
      if (error.response && error.response.data.message) {
        setErrors({ general: [error.response.data.message] });
      } else {
        setErrors({ general: ['Terjadi kesalahan. Silakan coba lagi.'] });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <>
      <NavbarBeforeLogin />
      
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 py-12">
        <div className="max-w-md w-full">
          {/* Back Button */}
          <Link 
            to="/forgot-password" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-[#FDBD59] mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Link>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-[#FDBD59] rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-black" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verifikasi Kode
              </h1>
              <p className="text-gray-600 mb-2">
                Masukkan 6-digit kode yang dikirim ke
              </p>
              <p className="text-gray-900 font-semibold">{email}</p>
              
              {/* Timer */}
              <div className="flex items-center justify-center mt-4 text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                <span>Kode kadaluarsa dalam: {formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Success Message */}
            {errors.success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  {errors.success[0]}
                </p>
              </div>
            )}

            {/* Error Message */}
            {errors.code && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">
                  {errors.code[0]}
                </p>
              </div>
            )}

            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">
                  {errors.general[0]}
                </p>
              </div>
            )}

            {/* Verification Form */}
            <form onSubmit={handleVerify} className="space-y-6">
              {/* Code Inputs */}
              <div className="flex justify-between space-x-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDBD59] focus:border-[#FDBD59]"
                    required
                  />
                ))}
              </div>

              <Button
                type="submit"
                disabled={loading || code.join('').length !== 6}
                className="w-full bg-[#FDBD59] text-black hover:bg-[#fcae3b] py-3 rounded-lg font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  'Verifikasi Kode'
                )}
              </Button>
            </form>

            {/* Resend Code */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Tidak menerima kode?{" "}
                <button
                  onClick={handleResendCode}
                  disabled={!canResend || loading}
                  className={`font-medium ${
                    canResend 
                      ? 'text-[#FDBD59] hover:underline cursor-pointer' 
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {canResend ? 'Kirim ulang kode' : 'Kirim ulang kode'}
                </button>
              </p>
            </div>

            {/* Success Verification */}
            {success && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-green-800 font-medium">Kode valid!</p>
                  <p className="text-green-700 text-sm mt-1">
                    Mengarahkan ke halaman reset password...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}