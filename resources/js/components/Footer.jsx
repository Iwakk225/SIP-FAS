import React from "react";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Building2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#1E2A3A] text-gray-300 pt-10 pb-6">
      <div className="border-t border-gray-600 mt-8 pt-4 text-center text-sm text-gray-400"></div>
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Logo & Deskripsi */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <div className="bg-[#FDBD59] p-2 rounded-lg">
              <Building2 className="w-6 h-6 text-[#1A1A1A]" />
            </div>
            <span className="font-bold text-lg text-white">SIP-FAS</span>
          </div>
          <p className="text-sm leading-relaxed mb-4">
            Sistem informasi pelaporan fasilitas untuk membantu warga melaporkan kerusakan
            fasilitas umum dengan mudah dan cepat
          </p>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-white">
              <Facebook size={18} />
            </a>
            <a href="#" className="hover:text-white">
              <Twitter size={18} />
            </a>
            <a href="#" className="hover:text-white">
              <Instagram size={18} />
            </a>
            <a href="#" className="hover:text-white">
              <Mail size={18} />
            </a>
          </div>
        </div>

        {/* Menu */}
        <div>
          <h3 className="text-white font-semibold mb-3">Menu</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-[#FDBD59] transition">Beranda</a></li>
            <li><a href="#" className="hover:text-[#FDBD59] transition">Buat Laporan</a></li>
            <li><a href="#" className="hover:text-[#FDBD59] transition">Status Laporan</a></li>
            <li><a href="#" className="hover:text-[#FDBD59] transition">Statistik</a></li>
          </ul>
        </div>

        {/* Kontak */}
        <div>
          <h3 className="text-white font-semibold mb-3">Kontak</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center space-x-2">
              <Phone size={16} /> <span>+62 812-345-678</span>
            </li>
            <li className="flex items-center space-x-2">
              <Mail size={16} /> <span>sipfassby@gmail.com</span>
            </li>
            <li className="flex items-center space-x-2">
              <MapPin size={16} /> <span>Surabaya, Indonesia</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Garis dan Copyright */}
      <div className="border-t border-gray-600 mt-8 pt-4 text-center text-sm text-gray-400">
        © 2025 <span className="text-[#FDBD59] font-semibold">SIP-FAS</span>. All rights reserved.
      </div>
    </footer>
  );
}
