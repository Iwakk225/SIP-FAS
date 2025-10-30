import React, { useState } from "react";
import { Mail, Lock, User, Phone, Chrome, Eye, EyeOff, LogIn } from "lucide-react";
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
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // Konfigurasi API base URL
  const API_URL = '/api'

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!agree) {
      alert('Anda harus menyetujui syarat dan ketentuan');
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setErrors({ password_confirmation: ['Konfirmasi password tidak sesuai'] });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post(`${API_URL}/register`, formData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      // Simpan token di localStorage
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect ke halaman dashboard atau home
      navigate('/LoginPage');
      
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

  return (
    <>
      <NavbarBeforeLogin/>
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 mb-10 mt-10">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-[#FDBD59] p-3 rounded-md">
            <LogIn className="text-black" size={32} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
          Daftar ke <span className="text-[#FDBD59]">SIP-FAS</span>
        </h1>

        {/* Error Message */}
        {errors.general && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 w-full max-w-md">
            {errors.general}
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
          {/* Nama */}
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
                placeholder="Masukkan nama lengkap anda"
                className="w-full px-3 py-2 outline-none bg-transparent text-gray-800"
                required
              />
            </div>
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name[0]}</p>}
          </div>

          {/* Email */}
          <div className="mb-5">
            <label className="block text-gray-800 font-medium mb-2">
              Alamat email
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3">
              <Mail size={18} className="text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Masukkan alamat email anda"
                className="w-full px-3 py-2 outline-none bg-transparent text-gray-800"
                required
              />
            </div>
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email[0]}</p>}
          </div>

          {/* Nomor Telepon */}
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
                placeholder="Masukkan nomor telepon anda"
                className="w-full px-3 py-2 outline-none bg-transparent text-gray-800"
                required
              />
            </div>
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone[0]}</p>}
          </div>

          {/* Kata Sandi */}
          <div className="mb-5">
            <label className="block text-gray-800 font-medium mb-2">
              Buat Kata Sandi
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 relative">
              <Lock size={18} className="text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Buat kata sandi anda"
                className="w-full px-3 py-2 outline-none bg-transparent text-gray-800"
                required
                minLength="6"
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

          {/* Konfirmasi Sandi */}
          <div className="mb-5">
            <label className="block text-gray-800 font-medium mb-2">
              Konfirmasi Kata Sandi
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 relative">
              <Lock size={18} className="text-gray-400" />
              <input
                type={showConfirm ? "text" : "password"}
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                placeholder="Konfirmasi kata sandi anda"
                className="w-full px-3 py-2 outline-none bg-transparent text-gray-800"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password_confirmation && (
              <p className="text-red-500 text-sm mt-1">
                {Array.isArray(errors.password_confirmation) 
                  ? errors.password_confirmation[0] 
                  : errors.password_confirmation}
              </p>
            )}
          </div>

          {/* Checkbox Persetujuan */}
          <div className="flex items-center text-sm mb-6">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="w-4 h-4 accent-[#FDBD59] mr-2 cursor-pointer"
            />
            <label className="text-gray-700">
              Saya setuju dengan{" "}
              <span className="text-[#FDBD59] font-medium cursor-pointer hover:underline">
                syarat & ketentuan
              </span>
            </label>
          </div>

          {/* Tombol Daftar */}
          <button
            type="submit"
            className={`w-full bg-[#FDBD59] hover:bg-[#fda94b] text-black font-semibold py-3 rounded-lg shadow transition cursor-pointer ${
              !agree || loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
            disabled={!agree || loading}
          >
            {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
          </button>

          {/* Garis pemisah */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-3 text-gray-500 text-sm">Atau daftar dengan</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Google Login */}
          <button 
            type="button"
            className="w-full border border-gray-400 hover:bg-gray-100 text-gray-700 font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Chrome size={20} className="text-red-500" />
            Google
          </button>

          {/* Link ke Login */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Sudah punya akun?{" "}
            <Link
              to="/LoginPage"
              className="text-[#FDBD59] font-medium hover:underline"
            >
              Masuk disini
            </Link>
          </p>
        </form>
      </div>
      <Footer/>
    </>
  );
}