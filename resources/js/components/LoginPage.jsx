import React, { useState } from "react";
import { Mail, Lock, Chrome, Eye, EyeOff, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import NavbarBeforeLogin from "./NavbarBeforeLogin";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

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
        Masuk ke <span className="text-[#FDBD59]">SIP-FAS</span>
      </h1>

      {/* Login Card */}
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        {/* Email */}
        <div className="mb-5">
          <label className="block text-gray-800 font-medium mb-2">
            Alamat email
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg px-3">
            <Mail size={18} className="text-gray-400" />
            <input
              type="email"
              placeholder="Masukkan email anda"
              className="w-full px-3 py-2 outline-none bg-transparent text-gray-800"
            />
          </div>
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
              placeholder="Masukkan kata sandi anda"
              className="w-full px-3 py-2 outline-none bg-transparent text-gray-800"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
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
            to="/forgot-password"
            className="text-[#FDBD59] hover:underline font-medium cursor-pointer"
          >
            Lupa kata sandi?
          </Link>
        </div>

        {/* Tombol Masuk */}
        <button className="w-full bg-[#FDBD59] hover:bg-[#fda94b] text-black font-semibold py-3 rounded-lg shadow transition cursor-pointer">
          Masuk
        </button>

        {/* Separator */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-3 text-gray-500 text-sm">Atau lanjutkan dengan</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Google */}
        <button className="w-full border border-gray-400 hover:bg-gray-100 text-gray-700 font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer">
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
      </div>
    </div>
    <Footer/>
    </>
  );
}
