import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Building2, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function NavbarBeforeLogin() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Beranda", path: "/" },
    { name: "Statistik", path: "/Statistik" },
    { name: "Status", path: "/status" },
    { name: "Lapor", path: "/LaporPage" },
    { name: "Kontak", path: "/KontakPage" },
  ];

  return (
    <nav className="w-full bg-white shadow-sm sticky top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="bg-[#FDBD59] p-2 rounded-lg">
            <Building2 className="w-6 h-6 text-[#1A1A1A]" />
          </div>
          <span className="font-bold text-lg text-[#1A1A1A]">SIP-FAS</span>
        </div>

        {/* Menu desktop */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-sm font-medium transition-colors ${
                location.pathname === link.path
                  ? "text-[#FDBD59]"
                  : "text-gray-700 hover:text-[#FDBD59]"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Tombol Login desktop */}
        <div className="hidden md:block">
          <Link to="/LoginPage">
            <Button className="bg-[#FDBD59] text-black hover:bg-[#fcae3b] px-10 py-4 rounded-md font-semibold cursor-pointer">
              Login
            </Button>
          </Link>
        </div>

        {/* Tombol menu mobile */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-800" />
            ) : (
              <Menu className="w-6 h-6 text-gray-800" />
            )}
          </button>
        </div>
      </div>

      {/* Menu dropdown mobile */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-md">
          <div className="flex flex-col items-start px-6 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`text-sm font-medium w-full py-2 ${
                  location.pathname === link.path
                    ? "text-[#FDBD59]"
                    : "text-gray-700 hover:text-[#FDBD59]"
                }`}
              >
                {link.name}
              </Link>
            ))}

            <Link to="/login" className="w-full mt-2">
              <Button className="w-full bg-[#FDBD59] text-black hover:bg-[#fcae3b] rounded-md font-semibold">
                Login
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
