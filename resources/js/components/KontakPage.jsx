import React, { useState } from "react";
import { Mail, MessageSquare, User, Send, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import axios from 'axios';
import Footer from "./Footer";
import NavbarBeforeLogin from "./NavbarBeforeLogin";

export default function KontakPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Nama lengkap wajib diisi";
    if (!formData.email.trim()) newErrors.email = "Email wajib diisi";
    if (!formData.message.trim()) newErrors.message = "Pesan wajib diisi";
    if (formData.message.length > 500) newErrors.message = "Pesan maksimal 500 kata";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      // Kirim ke backend Laravel
      const response = await axios.post('/api/contact', formData);
      
      setSuccess(true);
      setFormData({ name: "", email: "", message: "" });
      
      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
      
    } catch (error) {
      if (error.response && error.response.data.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Terjadi kesalahan. Silakan coba lagi." });
      }
    } finally {
      setLoading(false);
    }
  };

  const wordCount = formData.message.length;

  return (
    <>     
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Hubungi Kami
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ada pertanyaan atau masukan? Kami siap membantu Anda. Kirimkan pesan dan kami akan merespons secepat mungkin.
            </p>
          </div>

          {/* Divider */}
          <div className="flex justify-center mb-12">
            <div className="w-24 h-1 bg-[#FDBD59] rounded-full"></div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Contact Info Section */}
                <div className="bg-gradient-to-br from-[#FDBD59] to-[#fcae3b] p-8 text-white">
                  <div className="h-full flex flex-col justify-center">
                    <div className="mb-8">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
                        <Send className="w-6 h-6 stroke-black" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Kirim Pesan</h2>
                      <p className="text-white text-opacity-90">
                        Tim support kami siap membantu menyelesaikan masalah Anda dengan cepat dan efisien.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                          <Mail className="w-5 h-5 stroke-black" />
                        </div>
                        <div>
                          <p className="text-sm text-white text-opacity-80">Email</p>
                          <p className="font-semibold">sipfassby@gmail.com</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                          <MessageSquare className="w-5 h-5 stroke-black" />
                        </div>
                        <div>
                          <p className="text-sm text-white text-opacity-80">Response Time</p>
                          <p className="font-semibold">1-2 Jam Kerja</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Form Section */}
                <div className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Success Message */}
                    {success && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 font-medium">
                          Pesan berhasil dikirim! Kami akan merespons secepatnya.
                        </p>
                      </div>
                    )}

                    {/* General Error */}
                    {errors.general && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800">{errors.general}</p>
                      </div>
                    )}

                    {/* Name Field */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Lengkap *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDBD59] focus:border-[#FDBD59] ${
                            errors.name ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Masukkan Nama Lengkap"
                        />
                      </div>
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>

                    {/* Email Field */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDBD59] focus:border-[#FDBD59] ${
                            errors.email ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="emailkamu@mail.com"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>

                    {/* Message Field */}
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Pesan
                      </label>
                      <div className="relative">
                        <textarea
                          id="message"
                          name="message"
                          rows={6}
                          value={formData.message}
                          onChange={handleChange}
                          className={`block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDBD59] focus:border-[#FDBD59] resize-none ${
                            errors.message ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Tulis pesan kamu disini (Maksimal 500 kata)"
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                          <span className={wordCount > 500 ? "text-red-600" : ""}>
                            {wordCount}
                          </span>
                          /500 Kata
                        </div>
                      </div>
                      {errors.message && (
                        <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#FDBD59] hover:bg-[#fcae3b] text-black font-semibold py-3 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          KIRIM
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}