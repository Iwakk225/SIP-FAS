import React, { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Edit2, Save, X, Camera, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "./Footer";
import { Link, useNavigate } from "react-router-dom"; 

import axios from 'axios';
import { useAuth } from "../contexts/AuthContext";

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "sip-fas"); 
  formData.append("folder", "User-profile"); 
  formData.append("crop", "fill"); 
  formData.append("width", "200");
  formData.append("height", "200");

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dlwfk4gly'}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Upload failed: ${response.statusText}`);
    }

    return data.secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error(`Gagal upload foto profil: ${error.message}`);
  }
};

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingNewEmail, setPendingNewEmail] = useState('');
  const navigate = useNavigate();
  
  const { user, logout, updateUser } = useAuth();
  
  const API_URL = 'http://localhost:8000/api';
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: 'Surabaya, Jawa Timur'
  });

  const fetchUserStats = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/statistik-user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        setUserStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setUserStats({
        total: 0,
        selesai: 0,
        dalam_proses: 0,
        menunggu: 0,
        ditolak: 0
      });
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserStats();
      if (user.profile_photo_path) {
        setPhotoPreview(user.profile_photo_path); // kirim url ke cloudinary
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      let response;

      if (photoFile) {
        //upload foto profile ke cloudinary
        const photoUrl = await uploadToCloudinary(photoFile);

        response = await axios.put(`${API_URL}/profile`, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          profile_photo_url: photoUrl
        }, {
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        });
      } else {
        response = await axios.put(`${API_URL}/profile`, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        }, {
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        });
      }

      const updatedUser = response.data.data;
      updateUser(updatedUser);
      setIsEditing(false);
      setPhotoFile(null);

    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Gagal menyimpan perubahan. Coba lagi.');
    }
  };

  const handleUpdateEmail = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const newEmail = formData.email;
      if (newEmail === user?.email) {
        alert('Email belum berubah.');
        return;
      }

      const response = await axios.post(`${API_URL}/profile/request-email-change`, {
        email: newEmail
      }, { headers });

      setPendingNewEmail(newEmail);
      setShowEmailVerificationModal(true);

    } catch (error) {
      alert(error.response?.data?.message || 'Gagal meminta verifikasi. Coba lagi.');
    }
  };

  const handleVerifyEmailChange = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(`${API_URL}/profile/verify-email-change`, {
        email: user.email,
        new_email: pendingNewEmail,
        code: verificationCode
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const updatedUser = response.data.data;
      updateUser(updatedUser);
      setFormData(prev => ({ ...prev, email: updatedUser.email }));
      setShowEmailVerificationModal(false);
      setVerificationCode('');
      alert('Email berhasil diperbarui!');

    } catch (error) {
      if (error.response) {
        console.error('Error response:', error.response.data);
        alert('Error: ' + JSON.stringify(error.response.data));
      } else {
        alert('Verifikasi gagal. Coba lagi.');
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: 'Surabaya, Jawa Timur'
    });
    setPhotoFile(null);
    setPhotoPreview(user?.profile_photo_path || null);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await axios.post(`${API_URL}/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.log('Logout API error:', error);
    } finally {
      logout();
      navigate('/');
    }
  };

  const stats = [
    { label: "Total Laporan", value: userStats?.total ?? 0, color: "bg-blue-500" },
    { label: "Selesai", value: userStats?.selesai ?? 0, color: "bg-green-500" },
    { label: "Dalam Proses", value: userStats?.dalam_proses ?? 0, color: "bg-yellow-500" },
    { label: "Menunggu", value: userStats?.menunggu ?? 0, color: "bg-gray-500" },
    { label: "Ditolak", value: userStats?.ditolak ?? 0, color: "bg-red-500" }
  ];

  const profileImageUrl = photoPreview || user?.profile_photo_path;

  return (
    <>
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
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                    {profileImageUrl ? (
                      <img 
                        src={profileImageUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#FDBD59] flex items-center justify-center">
                        <User className="w-12 h-12 text-black" />
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label 
                        htmlFor="photo-upload" 
                        className="absolute bottom-0 right-0 bg-gray-800 text-white p-2 rounded-full cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                      </label>
                    </>
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
                      <>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDBD59]"
                        />
                        <Button
                          onClick={handleUpdateEmail}
                          size="sm"
                          className="ml-2 bg-blue-600 text-white hover:bg-blue-700 h-10 px-3"
                        >
                          Perbarui Email
                        </Button>
                      </>
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
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Statistik Laporan Saya</h2>
            
            {loadingStats ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FDBD59] mx-auto"></div>
                <p className="text-gray-600 mt-2">Memuat statistik...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                      <span className="text-white font-bold text-lg">{stat.value}</span>
                    </div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isEditing && (
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Keamanan Akun</h2>
              <div className="space-y-4">
                <Link
                  to="/ForgotPassword"
                  className="block w-full text-center bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors cursor-pointer font-semibold"
                >
                  🔐 Reset Password
                </Link>
                <p className="text-sm text-gray-600 text-center">
                  Ganti password akun Anda kapan saja
                </p>
              </div>
            </div>
          )}

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

      {/* Email Verification Modal */}
      {showEmailVerificationModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Verifikasi Perubahan Email</h3>
            <p className="text-gray-600 mb-4">
              Kami telah mengirim kode verifikasi ke <strong>{pendingNewEmail}</strong>
            </p>
            <input
              type="text"
              placeholder="Masukkan kode 6 digit"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#FDBD59]"
              maxLength={6}
            />
            <div className="flex space-x-2">
              <Button
                onClick={handleVerifyEmailChange}
                className="flex-1 bg-green-600 text-white hover:bg-green-700"
              >
                Verifikasi
              </Button>
              <Button
                onClick={() => setShowEmailVerificationModal(false)}
                variant="outline"
                className="flex-1"
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}