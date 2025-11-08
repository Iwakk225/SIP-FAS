import React, { useState } from "react";
import { Mail, Lock, Chrome, Eye, EyeOff, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import Footer from "./Footer";
import { useAuth } from "../contexts/AuthContext"; 

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth(); // Gunakan auth context

  const API_URL = '/api';

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
      const response = await axios.post(`${API_URL}/login`, formData);
      
      // Gunakan login function dari context
      await login(response.data.token, response.data.user);
      
      // Redirect ke halaman yang sesuai
      navigate('/');
      
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 mb-10 mt-10">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-[#FDBD59] p-3 rounded-md">
            <LogIn className="text-black" size={32} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
          Masuk ke <span className="text-[#FDBD59]">SIP-FAS</span>
        </h1>

        {/* Error Message */}
        {errors.general && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 w-full max-w-md">
            {errors.general}
          </div>
        )}

        {/* Login Card */}
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
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
                placeholder="Masukkan email anda"
                className="w-full px-3 py-2 outline-none bg-transparent text-gray-800"
                required
              />
            </div>
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email[0]}</p>}
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="block text-gray-800 font-medium mb-2">
              Kata sandi
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 relative">
              <Lock size={18} className="text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Masukkan kata sandi anda"
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

          {/* Ingat saya + Lupa sandi */}
          <div className="flex items-center justify-between text-sm mb-6">
            <label className="flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(!remember)}
                className="accent-[#FDBD59] cursor-pointer"
              />
              Ingat saya
            </label>
            <Link
              to="/ForgotPassword"
              className="text-[#FDBD59] hover:underline font-medium cursor-pointer"
            >
              Lupa kata sandi?
            </Link>
          </div>

          {/* Tombol Masuk */}
          <button
            type="submit"
            className={`w-full bg-[#FDBD59] hover:bg-[#fda94b] text-black font-semibold py-3 rounded-lg shadow transition ${
              loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            }`}
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>

          {/* Separator */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-3 text-gray-500 text-sm">Atau lanjutkan dengan</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Google */}
          <button 
            type="button"
            className="w-full border border-gray-400 hover:bg-gray-100 text-gray-700 font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Chrome size={20} className="text-red-500" />
            Google
          </button>

          {/* Link ke daftar */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Belum punya akun?{" "}
            <Link
              to="/SignUpPage"
              className="text-[#FDBD59] font-medium hover:underline cursor-pointer"
            >
              Daftar disini
            </Link>
          </p>
        </form>
      </div>
      <Footer/>
    </>
  );
}