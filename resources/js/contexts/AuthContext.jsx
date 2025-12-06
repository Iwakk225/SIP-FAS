// contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const LogoutConfirmationModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 mx-auto">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg 
              className="h-6 w-6 text-red-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Konfirmasi Logout
          </h3>
          
          <p className="text-sm text-gray-500 mb-6">
            Apakah Anda yakin ingin keluar dari akun Anda?
          </p>
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 cursor-pointer"
            >
              Ya, Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Cek status auth saat mount
  useEffect(() => {
    checkAuthStatus();
    // Cek token validity secara periodic
    const interval = setInterval(() => {
      if (isLoggedIn) {
        validateToken();
      }
    }, 300000); // Cek setiap 5 menit

    return () => clearInterval(interval);
  }, []);

  // Validasi token dengan server
  const validateToken = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      await axios.get('/api/validate-token', {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expired, coba refresh atau logout
        await handleTokenExpired();
      }
    }
  };

  // Handle token expired
  const handleTokenExpired = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (refreshToken) {
      try {
        // Coba refresh token
        const response = await axios.post('/api/refresh-token', {
          refresh_token: refreshToken
        });
        
        const { token, user: userData } = response.data;
        await login(token, userData, rememberMe);
      } catch (error) {
        // Refresh token juga expired, logout
        performLogout();
      }
    } else {
      // Tidak ada refresh token, logout
      performLogout();
    }
  };

  const checkAuthStatus = () => {
    // Cek apakah ada token di localStorage
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user');
    const remember = localStorage.getItem('remember_me') === 'true';
    
    setRememberMe(remember);

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        performLogout();
      }
    } else if (sessionStorage.getItem('auth_token') && sessionStorage.getItem('user')) {
      // Cek session storage untuk non-remember me
      try {
        const sessionToken = sessionStorage.getItem('auth_token');
        const sessionUser = sessionStorage.getItem('user');
        setUser(JSON.parse(sessionUser));
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing session data:', error);
        performLogout();
      }
    }
    setLoading(false);
  };

  const login = (token, userData, remember = false) => {
    // Simpan remember preference
    setRememberMe(remember);
    
    if (remember) {
      // Simpan di localStorage (persistent)
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('remember_me', 'true');
      // Hapus dari session storage jika ada
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user');
    } else {
      // Simpan di sessionStorage (hanya untuk session)
      sessionStorage.setItem('auth_token', token);
      sessionStorage.setItem('user', JSON.stringify(userData));
      // Hapus dari localStorage jika ada
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('remember_me');
    }
    
    setUser(userData);
    setIsLoggedIn(true);
    
    // Set axios default header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const performLogout = () => {
    // Hapus semua storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('remember_me');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user');
    
    // Hapus axios header
    delete axios.defaults.headers.common['Authorization'];
    
    // Reset state
    setUser(null);
    setIsLoggedIn(false);
    setRememberMe(false);
    setShowLogoutModal(false);
    
    // Redirect ke login page
    window.location.href = '/LoginPage';
  };

  const logout = () => {
    setShowLogoutModal(true);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Function untuk mendapatkan token (digunakan di komponen lain)
  const getToken = () => {
    if (rememberMe) {
      return localStorage.getItem('auth_token');
    } else {
      return sessionStorage.getItem('auth_token');
    }
  };

  const value = {
    isLoggedIn: !!user,
    user,
    login,
    logout, 
    performLogout,
    loading,
    rememberMe,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onConfirm={performLogout}
        onCancel={cancelLogout}
      />
    </AuthContext.Provider>
  );
};