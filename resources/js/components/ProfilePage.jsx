import React, { useState } from "react";
import { User, Mail, Phone, MapPin, Edit2, Save, X, Camera, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import NavbarAfterLogin from "./NavbarAfterLogin";
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const API_URL = '/api';
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: 'Surabaya, Jawa Timur',
    bio: 'Aktif melaporkan fasilitas publik sejak 2024'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = () => {
    // Simpan perubahan ke localStorage atau API
    const updatedUser = { ...user, ...formData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setIsEditing(false);
    // Di sini bisa tambahkan API call untuk update ke backend
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: 'Surabaya, Jawa Timur',
      bio: 'Aktif melaporkan fasilitas publik sejak 2024'
    });
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        // Panggil API logout di backend
        await axios.post(`${API_URL}/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.log('Logout API error:', error);
      // Tetap lanjut logout meski API error
    } finally {
      // Bersihkan localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      
      // Redirect ke login page
      navigate('/LoginPage');
    }
  };

  const stats = [
    { label: "Total Laporan", value: "24", color: "bg-blue-500" },
    { label: "Selesai", value: "18", color: "bg-green-500" },
    { label: "Dalam Proses", value: "4", color: "bg-yellow-500" },
    { label: "Menunggu", value: "2", color: "bg-gray-500" }
  ];

  return (
    <>
      <NavbarAfterLogin />
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
                <p className="text-gray-600">Kelola informasi profil Anda</p>
              </div>
              
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-[#FDBD59] text-black hover:bg-[#fcae3b] cursor-pointer"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profil
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSave}
                    className="bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Simpan
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="cursor-pointer"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Batal
                  </Button>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-6">
              {/* Photo Section */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-24 h-24 bg-[#FDBD59] rounded-full flex items-center justify-center">
                    <User className="w-12 h-12 text-black" />
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 bg-gray-800 text-white p-2 rounded-full cursor-pointer">
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDBD59]"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{formData.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDBD59]"
                      />
                    ) : (
                      <p className="text-gray-900">{formData.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Telepon
                  </label>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDBD59]"
                      />
                    ) : (
                      <p className="text-gray-900">{formData.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lokasi
                  </label>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {isEditing ? (
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDBD59]"
                      />
                    ) : (
                      <p className="text-gray-900">{formData.address}</p>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDBD59]"
                    />
                  ) : (
                    <p className="text-gray-900">{formData.bio}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Statistik Laporan</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                    <span className="text-white font-bold text-lg">{stat.value}</span>
                  </div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Logout Section */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Keluar Akun</h2>
            <div className="space-y-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors cursor-pointer font-semibold"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Keluar dari Akun
              </button>
              <p className="text-sm text-gray-600 text-center">
                Anda akan dialihkan ke halaman login
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}