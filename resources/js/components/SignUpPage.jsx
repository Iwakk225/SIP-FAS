import React, { useState } from "react";
import { Mail, Lock, User, Phone, Chrome, Eye, EyeOff, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import NavbarBeforeLogin from "./NavbarBeforeLogin";

export default function SignUpPage() {
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

      {/* Form Card */}
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        {/* Nama */}
        <div className="mb-5">
          <label className="block text-gray-800 font-medium mb-2">
            Nama Lengkap
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg px-3">
            <User size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Masukkan nama lengkap anda"
              className="w-full px-3 py-2 outline-none bg-transparent text-gray-800"
            />
          </div>
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
              placeholder="Masukkan alamat email anda"
              className="w-full px-3 py-2 outline-none bg-transparent text-gray-800"
            />
          </div>
        </div>

        {/* Nomor Telepon */}
        <div className="mb-5">
          <label className="block text-gray-800 font-medium mb-2">
            Nomer Telepon
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg px-3">
            <Phone size={18} className="text-gray-400" />
            <input
              type="tel"
              placeholder="Masukkan nomer telepon anda"
              className="w-full px-3 py-2 outline-none bg-transparent text-gray-800"
            />
          </div>
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
              placeholder="Buat kata sandi anda"
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

        {/* Konfirmasi Sandi */}
        <div className="mb-5">
          <label className="block text-gray-800 font-medium mb-2">
            Konfirmasi Kata Sandi Anda
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg px-3 relative">
            <Lock size={18} className="text-gray-400" />
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Konfirmasi Kata Sandi Anda"
              className="w-full px-3 py-2 outline-none bg-transparent text-gray-800"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
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
          className={`w-full bg-[#FDBD59] hover:bg-[#fda94b] text-black font-semibold py-3 rounded-lg shadow transition ${
            !agree ? "opacity-60 cursor-not-allowed" : ""
          }`}
          disabled={!agree}
        >
          Daftar Sekarang
        </button>

        {/* Garis pemisah */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-3 text-gray-500 text-sm">Atau daftar dengan</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Google Login */}
        <button className="w-full border border-gray-400 hover:bg-gray-100 text-gray-700 font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer">
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
      </div>
    </div>
    <Footer/>
    </>
  );
}
