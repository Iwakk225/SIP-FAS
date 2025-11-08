import React from "react";
import { Link } from "react-router-dom";
import { Home, Shield, Umbrella } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        
        {/* Navia Character Illustration */}
        <div className="relative mb-8">
          <div className="w-48 h-48 mx-auto relative">
            {/* Navia's Silhouette with Umbrella */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Umbrella */}
              <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-6 h-8 bg-yellow-500 rounded-t-lg"></div>
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-1 h-16 bg-yellow-600"></div>
              </div>
              
              {/* Navia's Dress */}
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-24 bg-gradient-to-b from-white to-blue-200 rounded-full"></div>
              
              {/* Crystals/Geo Elements */}
              <div className="absolute top-12 -left-2 w-6 h-6 bg-yellow-400 rotate-45 transform animate-pulse"></div>
              <div className="absolute top-8 -right-2 w-4 h-4 bg-amber-300 rotate-45 transform animate-pulse delay-300"></div>
              <div className="absolute bottom-16 left-4 w-3 h-3 bg-yellow-300 rotate-45 transform animate-pulse delay-500"></div>
            </div>
          </div>
          
          {/* Floating Geo Crystals */}
          <div className="absolute top-0 left-1/4 w-8 h-8 bg-amber-200 rotate-45 opacity-60 animate-bounce"></div>
          <div className="absolute top-4 right-1/4 w-6 h-6 bg-yellow-300 rotate-45 opacity-80 animate-bounce delay-200"></div>
          <div className="absolute bottom-8 left-1/3 w-5 h-5 bg-amber-100 rotate-45 opacity-70 animate-bounce delay-400"></div>
        </div>

        {/* Error Code dengan Style Elegan */}
        <div className="mb-6">
          <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-amber-500 mb-2">
            404
          </h1>
          <div className="flex items-center justify-center space-x-2 text-blue-600 mb-4">
            <Umbrella className="w-6 h-6" />
            <h2 className="text-2xl font-semibold">Page Not Found</h2>
            <Umbrella className="w-6 h-6" />
          </div>
        </div>

        {/* Message dengan tema Navia */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-blue-200 shadow-lg">
          <p className="text-gray-700 text-lg mb-4">
            "Sepertinya halaman yang Anda cari telah hilang seperti Geo Crystal yang tersembunyi..."
          </p>
          <p className="text-gray-600">
            Jangan khawatir, sebagai Presiden Spina di Rosula, saya akan membantu Anda kembali ke jalan yang benar!
            <br></br>
            - Navia~
          </p>
        </div>

        {/* Action Buttons dengan tema Spina di Rosula */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/"
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span>Kembali ke Beranda</span>
          </Link>
          
          <Link
            to="/LaporPage"
            className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-3 rounded-full font-semibold hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl cursor-pointer"
          >
            <Shield className="w-5 h-5" />
            <span>Lapor Kerusakan</span>
          </Link>
        </div>

        {/* Signature Style Navia */}
        <div className="mt-12 pt-6 border-t border-blue-200">
          <div className="flex items-center justify-center space-x-2 text-blue-600">
            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
            <p className="text-sm font-medium">SIP-FAS · Spina di Rosula</p>
            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            "Kepercayaan dan keanggunan adalah segalanya."
          </p>
        </div>

        {/* Background Elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-amber-200 rounded-full opacity-30 animate-pulse delay-300"></div>
          <div className="absolute bottom-1/4 left-1/3 w-10 h-10 bg-blue-300 rounded-full opacity-25 animate-pulse delay-500"></div>
          <div className="absolute bottom-1/3 right-1/3 w-14 h-14 bg-amber-100 rounded-full opacity-20 animate-pulse delay-700"></div>
        </div>
      </div>
    </div>
  );
}