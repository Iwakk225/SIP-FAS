import React, { useState } from "react";
import { User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import Footer from "./Footer";
import NavbarBeforeLogin from "./NavbarBeforeLogin";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  
  const navigate = useNavigate();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post('/api/register', formData);
      
      // Tampilkan popup success
      setShowSuccessPopup(true);
      
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

  const handleClosePopup = () => {
    setShowSuccessPopup(false);
    navigate('/LoginPage'); // Redirect ke login page
  };

  return (
    <>
      <NavbarBeforeLogin/>
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 mb-10 mt-10">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-[#FDBD59] p-3 rounded-md">
            <User className="text-black" size={32} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
          Daftar <span className="text-[#FDBD59]">SIP-FAS</span>
        </h1>

        {/* Error Message */}
        {errors.general && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 w-full max-w-md">
            {errors.general}
          </div>
        )}

        {/* Registration Card */}
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
          {/* Name */}
          <div className="mb-5">
            <label className="block text-gray-800 font-medium mb-2">
              Nama Lengkap
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3">
              <User size={18} className="text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Masukkan nama lengkap"
                className="w-full px-3 py-2 outline-none bg-transparent text-gray-800"
                required
              />
            </div>
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name[0]}</p>}
          </div>

          {/* Email */}
          <div className="mb-5">
            <label className="block text-gray-800 font-medium mb-2">
              Alamat Email
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3">
              <Mail size={18} className="text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Masukkan email anda"
                className="w-full px-3 py-2 outline-none bg-transparent text-gray-800"
                required
              />
            </div>
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email[0]}</p>}
          </div>

          {/* Phone */}
          <div className="mb-5">
            <label className="block text-gray-800 font-medium mb-2">
              Nomor Telepon
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3">
              <Phone size={18} className="text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Masukkan nomor telepon"
                className="w-full px-3 py-2 outline-none bg-transparent text-gray-800"
                required
              />
            </div>
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone[0]}</p>}
          </div>

          {/* Password */}
          <div className="mb-5">
            <label className="block text-gray-800 font-medium mb-2">
              Kata Sandi
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 relative">
              <Lock size={18} className="text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Masukkan kata sandi"
                className="w-full px-3 py-2 outline-none bg-transparent text-gray-800"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password[0]}</p>}
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label className="block text-gray-800 font-medium mb-2">
              Konfirmasi Kata Sandi
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 relative">
              <Lock size={18} className="text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                placeholder="Konfirmasi kata sandi"
                className="w-full px-3 py-2 outline-none bg-transparent text-gray-800"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full bg-[#FDBD59] hover:bg-[#fda94b] text-black font-semibold py-3 rounded-lg shadow transition ${
              loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            }`}
            disabled={loading}
          >
            {loading ? 'Mendaftarkan...' : 'Daftar'}
          </button>

          {/* Link to Login */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Sudah punya akun?{" "}
            <Link
              to="/login"
              className="text-[#FDBD59] font-medium hover:underline cursor-pointer"
            >
              Masuk disini
            </Link>
          </p>
        </form>
      </div>
      <Footer/>

      {/* Success Popup Modal */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-auto transform transition-all">
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Pendaftaran Berhasil!
              </h3>
              <p className="text-gray-600">
                Akun Anda telah berhasil dibuat. Silakan login untuk mulai menggunakan SIP-FAS.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleClosePopup}
                className="w-full bg-[#FDBD59] hover:bg-[#fda94b] text-black font-semibold py-3 rounded-lg transition cursor-pointer"
              >
                Kembali ke Login
              </button>
              
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-lg transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}