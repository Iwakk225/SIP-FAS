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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import formImg from "@/assets/Form.png";
import trackImg from "@/assets/Track.png";
import feedbackImg from "@/assets/Feedback.png";

export default function LandingPage() {
    const [stats, setStats] = useState({
        completedReports: 169,
        activeReports: 31,
        avgRating: "4.8",
        avgDaysToComplete: 12
    });

    const [publicReviews, setPublicReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);

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

    return (
        <>
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
                        <div className="flex flex-col sm:flex-row gap-4 mt-10">
                            <Link to="/LaporPage" className="w-full sm:w-auto">
                                <Button className="bg-[#FDBD59] hover:bg-[#fda94b] text-black font-normal px-12 py-6 rounded shadow-md flex items-center justify-center gap-2 text-lg w-full sm:w-auto cursor-pointer">
                                    <Camera size={20} /> Laporkan Sekarang
                                </Button>
                            </Link>
                            <Link to="/StatusPage" className="w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    className="border-2 border-[#FDBD59] text-black bg-[#FDBD59]/10 font-normal px-10 py-6 rounded flex items-center justify-center gap-2 text-lg w-full sm:w-auto cursor-pointer"
                                >
                                    <Search size={20} /> Cek Status Laporan
                                </Button>
                            </Link>
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
            <section className="bg-white py-20 px-6 md:px-16 text-center">
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
            <section className="bg-white py-20 px-6 md:px-16 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Fitur <span className="text-[#FDBD59]">Unggulan</span>
                </h2>
                <p className="text-gray-600 mb-16 max-w-2xl mx-auto">
                    Teknologi modern untuk memudahkan pelaporan dan penanganan
                    fasilitas umum
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6">
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
                    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6">
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
                    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6">
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
                <div className="bg-[#1C2C44] rounded-2xl shadow-lg max-w-3xl mx-auto p-10">
                    <h3 className="text-lg md:text-xl font-semibold mb-2">
                        Bergabunglah dengan komunitas peduli fasilitas umum
                    </h3>
                    <p className="text-gray-300 mb-6 text-sm">
                        Setiap laporan yang anda buat membantu menciptakan
                        lingkungan yang lebih baik untuk kita semua
                    </p>
                    <Link to="/LaporPage">
                        <Button className="bg-[#FDBD59] hover:bg-[#fda94b] text-black font-medium px-8 py-5 rounded-lg shadow cursor-pointer">
                            Mulai melaporkan
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Section Ulasan */}
            <section className="bg-[#1E293B] py-16 px-6 md:px-16">
                <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
                    Ulasan dari <span className="text-[#FDBD59]">Warga</span>
                </h2>
                <p className="text-white text-center mb-12 max-w-2xl mx-auto">
                    Dengar langsung pengalaman warga setelah melaporkan fasilitas rusak
                </p>

                {loadingReviews ? (
                    <div className="text-center py-8">Loading ulasan...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {publicReviews.length > 0 ? (
                            publicReviews.map((review, index) => (
                                <div key={index} className="bg-gray-50 p-5 rounded-xl shadow-sm border border-gray-200">
                                    <div className="flex items-start gap-3 mb-4">
                                        <img
                                            src={review.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user?.name || "User")}&background=0D8ABC&color=fff`}
                                            alt={review.user?.name || "User"}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div>
                                            <div className="font-semibold text-gray-900">{review.user?.name || "Anonim"}</div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(review.created_at).toLocaleDateString('id-ID')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex mb-3">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={16}
                                                className={`mr-0.5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="space-y-3">
                                    {/* Komentar User */}
                                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                                        {review.comment || "Tidak ada komentar."}
                                    </p>

                                    {/* Balasan Admin */}
                                    {review.admin_reply && (
                                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">A</div>
                                            <span className="text-xs font-medium text-blue-700">Admin SIP-FAS</span>
                                        </div>
                                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{review.admin_reply}</p>
                                        {review.admin_replied_at && (
                                            <p className="text-xs text-gray-500 mt-1">
                                            {new Date(review.admin_replied_at).toLocaleDateString('id-ID')}
                                            </p>
                                        )}
                                        </div>
                                    )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-3 text-center text-gray-500 py-8">
                                Belum ada ulasan. Jadilah yang pertama!
                            </div>
                        )}
                    </div>
                )}
            </section>

            <Footer />
        </>
    );
}