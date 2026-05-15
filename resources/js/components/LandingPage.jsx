import React, { useState, useEffect } from "react";
import {
    Camera,
    Search,
    CheckCircle,
    Clock,
    ShieldCheck,
    Wrench,
    ArrowRight,
    Smartphone,
    MapPin,
    Star,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    LogIn,
    UserPlus,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Footer from "./Footer";
import formImg from "@/assets/Form.webp";
import trackImg from "@/assets/Track.webp";
import feedbackImg from "@/assets/Feedback.webp";

export default function LandingPage() {
    const [stats, setStats] = useState({
        completedReports: 169,
        activeReports: 31,
        avgRating: "4.8",
        avgDaysToComplete: 12
    });

    const [publicReviews, setPublicReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
    const [showAuthAlert, setShowAuthAlert] = useState(false);

    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();

    // publik rating dan ulasan dengan caching
    useEffect(() => {
        const CACHE_KEY = 'sipfas_public_reviews';
        const EXPIRY_DAYS = 0; 

        const loadReviews = async () => {
            try {
                const now = new Date().getTime();
                const cached = localStorage.getItem(CACHE_KEY);

                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    const isExpired = (now - timestamp) > (EXPIRY_DAYS * 24 * 60 * 60 * 1000);

                    if (!isExpired) {
                        // Gunakan cache
                        setPublicReviews(data);
                        setLoadingReviews(false);
                        return;
                    }
                }

                // Ambil data baru dari API
                const res = await fetch('/api/public-reviews');
                const result = await res.json();
                const reviews = result.reviews || [];

                // Simpan ke cache
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    data: reviews,
                    timestamp: now
                }));

                setPublicReviews(reviews);
            } catch (err) {
                console.error("Gagal load ulasan:", err);
                // Fallback ke cache walau expired
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    setPublicReviews(JSON.parse(cached).data);
                }
            } finally {
                setLoadingReviews(false);
            }
        };

        loadReviews();
    }, []);

    // FETCH STATISTIK
    useEffect(() => {
        const fetchLandingStats = async () => {
            try {
                const response = await fetch("/api/stats/landing");
                if (!response.ok) throw new Error("Gagal mengambil data");

                const data = await response.json();
                setStats({
                    completedReports: data.data.completed_reports ?? 169,
                    activeReports: data.data.active_reports ?? 31,
                    avgRating: (data.data.avg_rating ?? "4.8").toString(),
                    avgDaysToComplete: data.data.avg_days_to_complete ?? 12
                });
            } catch (error) {
                console.warn("Gagal load statistik real-time, pakai data dummy:", error.message);
            }
        };
        fetchLandingStats();
    }, []);

    const handleProtectedNavigation = (e, path) => {
        e.preventDefault();
        if (!isLoggedIn) {
            setShowAuthAlert(true);
            setTimeout(() => setShowAuthAlert(false), 5000); // Hide after 5s
        } else {
            navigate(path);
        }
    };

    const nextReview = () => {
        setCurrentReviewIndex((prev) => (prev === publicReviews.length - 1 ? 0 : prev + 1));
    };

    const prevReview = () => {
        setCurrentReviewIndex((prev) => (prev === 0 ? publicReviews.length - 1 : prev - 1));
    };

    return (
        <div className="transition-colors duration-300">
            {/* ALERT UNTUK UNAUTHENTICATED USERS */}
            {showAuthAlert && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md animate-in slide-in-from-top-4 fade-in duration-300">
                    <Alert className="bg-amber-50 border-amber-200 shadow-xl">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <AlertDescription className="text-sm text-amber-800 ml-2">
                            <p className="font-semibold text-base mb-1">
                                Akses Dibatasi
                            </p>
                            <p className="mb-3">
                                Anda harus login terlebih dahulu untuk mengakses fitur ini.
                            </p>
                            <div className="flex gap-2">
                                <Link to="/LoginPage" className="flex-1">
                                    <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white cursor-pointer">
                                        <LogIn className="w-4 h-4 mr-2" /> Login
                                    </Button>
                                </Link>
                                <Link to="/SignUpPage" className="flex-1">
                                    <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-100 cursor-pointer">
                                        <UserPlus className="w-4 h-4 mr-2" /> Daftar
                                    </Button>
                                </Link>
                            </div>
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            {/* HERO SECTION */}
            <section
                className="relative min-h-screen flex flex-col justify-center bg-cover bg-center"
                style={{
                    backgroundImage:
                        "url('https://images.unsplash.com/photo-1737111144116-45caca7f6317?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
                }}
            >
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm"></div>
                <div className="relative z-10 px-6 sm:px-10 md:px-20 py-24 md:py-32 max-w-6xl mx-auto w-full">
                    <div className="max-w-2xl text-left">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                            Laporkan Fasilitas <br />
                            <span className="text-[#FDBD59]">Rusak</span> dengan <br /> Mudah
                        </h1>
                        <p className="text-gray-700 text-base md:text-lg mt-6 max-w-lg">
                            SIP-FAS membantu masyarakat melaporkan kerusakan
                            fasilitas umum seperti lampu jalan, jalan rusak,
                            atau area publik yang kotor dengan cepat dan
                            efisien.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-5 mt-10">
                            <div className="w-full sm:w-auto group">
                                <Button onClick={(e) => handleProtectedNavigation(e, "/LaporPage")} className="bg-gradient-to-r from-[#FDBD59] to-[#FCA311] hover:from-[#FCA311] hover:to-[#E58C00] text-gray-900 font-bold h-16 px-10 rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 text-lg w-full sm:w-auto cursor-pointer border border-[#FCA311]/50 ring-4 ring-[#FDBD59]/20">
                                    <Camera size={24} className="group-hover:scale-110 transition-transform duration-300" /> Laporkan Sekarang
                                </Button>
                            </div>
                            <div className="w-full sm:w-auto group">
                                <Button
                                    onClick={(e) => handleProtectedNavigation(e, "/StatusPage")}
                                    variant="outline"
                                    className="border-2 border-gray-800 text-gray-800 bg-white/90 backdrop-blur-xl hover:bg-gray-900 hover:text-white font-bold h-16 px-10 rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 text-lg w-full sm:w-auto cursor-pointer"
                                >
                                    <Search size={24} className="group-hover:scale-110 transition-transform duration-300" /> Cek Status Laporan
                                </Button>
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-start gap-6 mt-10 text-gray-700">
                            <div className="flex items-center gap-2">
                                <CheckCircle size={18} className="text-green-500" />
                                <span>Gratis dan mudah</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={18} className="text-black" />
                                <span>Respon cepat</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={18} className="text-blue-500" />
                                <span>Terpercaya</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CARA KERJA SECTION */}
            <section className="bg-gray-50 py-24 px-6 md:px-16 text-center transition-colors duration-300">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Cara kerja <span className="text-[#FDBD59]">SIP-FAS</span>
                </h2>
                <p className="text-gray-600 mb-16 max-w-2xl mx-auto">
                    Proses pelaporan yang sederhana dan transparan untuk
                    memperbaiki fasilitas umum
                </p>
                <div className="flex flex-col md:flex-row justify-center items-center gap-10 md:gap-6">
                    <div className="relative border border-[#FDBD59]/40 rounded-xl p-8 w-full max-w-xs bg-white shadow-sm hover:shadow-md transition duration-300">
                        <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                            <div className="bg-blue-500 text-white p-3 rounded-full">
                                <Camera size={24} />
                            </div>
                            <span className="text-[#FDBD59] font-bold text-lg">01</span>
                        </div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-2 text-left">
                            Buat Laporan
                        </h3>
                        <p className="text-gray-600 text-sm text-left">
                            Ambil foto fasilitas yang rusak dan isi form laporan
                        </p>
                    </div>
                    <ArrowRight className="hidden md:block text-gray-400 w-8 h-8" />
                    <div className="relative border border-[#FDBD59]/40 rounded-xl p-8 w-full max-w-xs bg-white shadow-sm hover:shadow-md transition duration-300">
                        <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                            <div className="bg-green-500 text-white p-3 rounded-full">
                                <CheckCircle size={24} />
                            </div>
                            <span className="text-[#FDBD59] font-bold text-lg">02</span>
                        </div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-2 text-left">
                            Diverifikasi oleh admin
                        </h3>
                        <p className="text-gray-600 text-sm text-left">
                            Tim admin akan memverifikasi laporan Anda
                        </p>
                    </div>
                    <ArrowRight className="hidden md:block text-gray-400 w-8 h-8" />
                    <div className="relative border border-[#FDBD59]/40 rounded-xl p-8 w-full max-w-xs bg-white shadow-sm hover:shadow-md transition duration-300">
                        <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                            <div className="bg-yellow-400 text-white p-3 rounded-full">
                                <Wrench size={24} />
                            </div>
                            <span className="text-[#FDBD59] font-bold text-lg">03</span>
                        </div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-2 text-left">
                            Diperbaiki
                        </h3>
                        <p className="text-gray-600 text-sm text-left">
                            Tim teknis akan melakukan perbaikan dan Anda akan
                            mendapatkan notifikasi
                        </p>
                    </div>
                </div>
            </section>

            {/* FITUR UNGGULAN SECTION */}
            <section className="bg-white py-24 px-6 md:px-16 text-center transition-colors duration-300">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Fitur <span className="text-[#FDBD59]">Unggulan</span>
                </h2>
                <p className="text-gray-600 mb-16 max-w-2xl mx-auto">
                    Teknologi modern untuk memudahkan pelaporan dan penanganan
                    fasilitas umum
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <div className="bg-gray-50 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
                        <img
                            src={formImg}
                            alt="Pelaporan Mudah"
                            className="rounded-lg mb-6 h-48 w-full object-cover"
                        />
                        <div className="flex items-center justify-center bg-[#FDBD59] w-10 h-10 rounded-md mx-auto mb-3">
                            <Smartphone className="text-white" size={20} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 text-left">
                            Pelaporan mudah
                        </h3>
                        <p className="text-gray-600 text-sm text-left">
                            Interface yang user-friendly memungkinkan siapa saja
                            melaporkan masalah fasilitas dengan cepat.
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
                        <img
                            src={trackImg}
                            alt="Tracking Real-time"
                            className="rounded-lg mb-6 h-48 w-full object-cover"
                        />
                        <div className="flex items-center justify-center bg-[#FDBD59] w-10 h-10 rounded-md mx-auto mb-3">
                            <MapPin className="text-white" size={20} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 text-left">
                            Tracking Real-time
                        </h3>
                        <p className="text-gray-600 text-sm text-left">
                            Pantau status laporan Anda secara real-time dari
                            pengajuan hingga penyelesaian.
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
                        <img
                            src={feedbackImg}
                            alt="Sistem Feedback"
                            className="rounded-lg mb-6 h-48 w-full object-cover"
                        />
                        <div className="flex items-center justify-center bg-[#FDBD59] w-10 h-10 rounded-md mx-auto mb-3">
                            <Star className="text-white" size={20} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 text-left">
                            Sistem Feedback
                        </h3>
                        <p className="text-gray-600 text-sm text-left">
                            Berikan rating dan feedback untuk membantu
                            meningkatkan kualitas layanan publik.
                        </p>
                    </div>
                </div>
            </section>

            {/* DAMPAK KOMUNITAS SECTION */}
            <section className="bg-[#1E293B] text-white py-20 px-6 md:px-16 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Dampak Komunitas
                </h2>
                <p className="text-gray-300 mb-16 max-w-2xl mx-auto">
                    Bersama-sama kita telah membuat perubahan positif untuk
                    fasilitas umum
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-16">
                    <div className="bg-[#1C2C44] rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
                        <div className="flex flex-col items-center">
                            <div className="bg-[#2A3C56] p-4 rounded-full mb-4">
                                <CheckCircle className="text-[#FDBD59]" size={28} />
                            </div>
                            <h3 className="text-2xl font-bold">{stats.completedReports}</h3>
                            <p className="text-gray-300 mt-2 text-sm">Laporan diselesaikan</p>
                        </div>
                    </div>
                    <div className="bg-[#1C2C44] rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
                        <div className="flex flex-col items-center">
                            <div className="bg-[#2A3C56] p-4 rounded-full mb-4">
                                <Clock className="text-[#FDBD59]" size={28} />
                            </div>
                            <h3 className="text-2xl font-bold">{stats.activeReports}</h3>
                            <p className="text-gray-300 mt-2 text-sm">Laporan aktif</p>
                        </div>
                    </div>
                    <div className="bg-[#1C2C44] rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
                        <div className="flex flex-col items-center">
                            <div className="bg-[#2A3C56] p-4 rounded-full mb-4">
                                <Star className="text-[#FDBD59]" size={28} />
                            </div>
                            <h3 className="text-2xl font-bold">{stats.avgRating}</h3>
                            <p className="text-gray-300 mt-2 text-sm">Rating kepuasan</p>
                        </div>
                    </div>
                    <div className="bg-[#1C2C44] rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
                        <div className="flex flex-col items-center">
                            <div className="bg-[#2A3C56] p-4 rounded-full mb-4">
                                <CalendarDays className="text-[#FDBD59]" size={28} />
                            </div>
                            <h3 className="text-2xl font-bold">{stats.avgDaysToComplete}</h3>
                            <p className="text-gray-300 mt-2 text-sm">Hari rata-rata diselesaikan</p>
                        </div>
                    </div>
                </div>

                {/* Ajakan Bergabung */}
                <div className="bg-[#FDBD59] text-gray-900 rounded-3xl shadow-2xl max-w-4xl mx-auto p-12 mt-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/20 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-orange-500/20 blur-3xl"></div>
                    <div className="relative z-10">
                        <h3 className="text-2xl md:text-3xl font-bold mb-4">
                            Bergabunglah dengan komunitas peduli fasilitas umum
                        </h3>
                        <p className="text-gray-800 mb-8 text-base md:text-lg max-w-2xl mx-auto">
                            Setiap laporan yang Anda buat membantu menciptakan
                            lingkungan yang lebih baik dan aman untuk kita semua.
                        </p>
                        <div className="flex justify-center w-full" onClick={(e) => handleProtectedNavigation(e, "/LaporPage")}>
                            <Button className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 sm:px-10 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all cursor-pointer text-base sm:text-lg w-full sm:w-auto">
                                Mulai Melaporkan Sekarang
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section Ulasan dengan Carousel */}
            <section className="bg-[#1E293B] py-24 px-6 md:px-16 transition-colors duration-300">
                <div className="max-w-4xl mx-auto relative">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
                        Ulasan dari <span className="text-[#FDBD59]">Warga</span>
                    </h2>
                    <p className="text-gray-300 text-center mb-16">
                        Dengar langsung pengalaman warga setelah melaporkan fasilitas rusak
                    </p>

                    {loadingReviews ? (
                        <div className="text-center py-8 text-gray-300">Loading ulasan...</div>
                    ) : (
                        <div>
                            {publicReviews.length > 0 ? (
                                <div className="relative bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 min-h-[250px] flex flex-col justify-center transition-colors duration-300">
                                    {/* Navigation Buttons */}
                                    <button 
                                        onClick={prevReview}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 md:-ml-6 bg-white p-2 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors z-10 cursor-pointer text-gray-800"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    
                                    <button 
                                        onClick={nextReview}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 md:-mr-6 bg-white p-2 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors z-10 cursor-pointer text-gray-800"
                                    >
                                        <ChevronRight size={20} />
                                    </button>

                                    {/* Review Content */}
                                    <div className="animate-in fade-in zoom-in-95 duration-500 text-center max-w-2xl mx-auto">
                                        <div className="flex justify-center mb-4">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={20}
                                                    className={`mx-1 ${i < publicReviews[currentReviewIndex].rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                                                />
                                            ))}
                                        </div>
                                        
                                        <p className="text-base md:text-lg text-gray-700 italic mb-6 line-clamp-3">
                                            "{publicReviews[currentReviewIndex].comment || "Pelayanan yang sangat baik."}"
                                        </p>
                                        
                                        <div className="flex flex-col items-center gap-2 mt-auto">
                                            <img
                                                src={publicReviews[currentReviewIndex].user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(publicReviews[currentReviewIndex].user?.name || "User")}&background=FDBD59&color=fff`}
                                                alt={publicReviews[currentReviewIndex].user?.name || "User"}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                                            />
                                            <div>
                                                <div className="font-bold text-gray-900 text-base">
                                                    {publicReviews[currentReviewIndex].user?.name || "Anonim"}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(publicReviews[currentReviewIndex].created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Admin Reply - Opsional jika ada */}
                                        {publicReviews[currentReviewIndex].admin_reply && (
                                            <div className="mt-4 bg-blue-50 border border-blue-100 p-3 rounded-xl text-left max-w-lg mx-auto">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">A</div>
                                                    <span className="text-xs font-semibold text-blue-700">Admin SIP-FAS</span>
                                                </div>
                                                <p className="text-gray-700 text-xs">{publicReviews[currentReviewIndex].admin_reply}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Pagination Dots */}
                                    <div className="flex justify-center gap-2 mt-6">
                                        {publicReviews.map((_, idx) => (
                                            <div 
                                                key={idx} 
                                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentReviewIndex ? 'w-6 bg-[#FDBD59]' : 'w-1.5 bg-gray-300'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-8 bg-white rounded-2xl shadow-sm">
                                    Belum ada ulasan. Jadilah yang pertama!
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}