import React, { useState, useEffect } from "react";
import {
  X, Send, Clock, UserCheck, Wrench, CheckCircle, XCircle,
  AlertCircle, MapPin, Calendar, Camera, FileText, Download,
  Phone, Users, User, Eye, Star
} from "lucide-react";
import axios from "axios";

const DetailLaporanModal = ({ isOpen, onClose, laporan, onRatingSubmit }) => {
  if (!isOpen || !laporan) return null;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState(''); 
  const [isRated, setIsRated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [petugasLaporan, setPetugasLaporan] = useState([]);
  const [isLoadingPetugas, setIsLoadingPetugas] = useState(false);
  const [adminReply, setAdminReply] = useState(null);
  const [adminRepliedAt, setAdminRepliedAt] = useState(null);

  const trackingSteps = [
    {
      id: 1,
      status: "Validasi",
      title: "Laporan Terkirim",
      description: "Laporan Anda telah berhasil dikirim",
      icon: Send,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      id: 2,
      status: "Ditolak",
      title: "Laporan Ditolak",
      description: "Laporan tidak dapat diproses",
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-50",
    },
  ];

  const trackingStepsLengkap = [
    {
      id: 1,
      status: "Validasi",
      title: "Laporan Terkirim",
      description: "Menunggu validasi oleh admin",
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
    },
    {
      id: 2,
      status: "Tervalidasi",
      title: "Laporan Divalidasi!",
      description: "Admin akan segera mengirim petugas untuk menangani",
      icon: UserCheck,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      id: 3,
      status: "Dalam Proses",
      title: "Petugas Dikerahkan",
      description: "Dalam proses perbaikan fasilitas",
      icon: Wrench,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
    {
      id: 4,
      status: "Selesai",
      title: "Fasilitas Diperbaiki!",
      description: "Fasilitas sudah selesai diperbaiki",
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-50",
    }, 
  ];

  const getToken = () => {
    return localStorage.getItem('auth_token') ||
           sessionStorage.getItem('auth_token');
  };

  const fetchPetugas = async () => {
    if (laporan.status !== "Ditolak" && laporan.id) {
      setIsLoadingPetugas(true);
      try {
        const token = getToken();
        const res = await axios.get(
          `http://localhost:8000/api/laporan/${laporan.id}/petugas`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPetugasLaporan(res.data.data || []);
      } catch (err) {
        setPetugasLaporan([]);
      } finally {
        setIsLoadingPetugas(false);
      }
    }
  };

  useEffect(() => {
    if (isOpen && laporan?.id) {
      fetchPetugas();

      const fetchUserRating = async () => {
        try {
          const token = getToken();
          const res = await axios.get(
            `http://localhost:8000/api/laporan/${laporan.id}/rating`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res.data.rating) {
            setRating(res.data.rating.rating);
            setComment(res.data.rating.comment || '');
            setIsRated(true);

            if (res.data.rating.admin_reply) {
              setAdminReply(res.data.rating.admin_reply);
              setAdminRepliedAt(res.data.rating.admin_replied_at);
            }
          }
        } catch (err) {
          // Tidak ada rating sebelumnya
        }
      };

      fetchUserRating();
    }
  }, [isOpen, laporan?.id]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric"
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const getCurrentStep = (status) => {
    const s = status?.toLowerCase();
    if (s === "validasi") return 1;
    if (s === "tervalidasi") return 2;
    if (s === "dalam proses") return 3;
    if (s === "selesai") return 4;
    if (s === "ditolak") return 2;
    return 1;
  };

  const getTrackingSteps = (status) => {
    const s = status?.toLowerCase();
    if (s === "ditolak") return trackingSteps;
    return trackingStepsLengkap;
  };

  const downloadFile = (fileUrl, filename) => {
    try {
      let downloadUrl = fileUrl;

      if (fileUrl.includes('cloudinary.com')) {
        downloadUrl = fileUrl.replace(/\/raw\/upload\//g, '/upload/');
        if (downloadUrl.includes('/upload/')) {
          downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
        }
        if (!downloadUrl.includes('?dl=1')) {
          downloadUrl += (downloadUrl.includes('?') ? '&dl=1' : '?dl=1');
        }
      }

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      alert('Gagal mengunduh file. Silakan coba lagi nanti.');
    }
  };

  const handleRate = async () => {
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      const token = getToken();
      const res = await axios.post(
        `http://localhost:8000/api/laporan/${laporan.id}/rating`,
        { 
          rating: rating,
          comment: comment.trim() || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 201) {
        if (onRatingSubmit) onRatingSubmit();
        setIsRated(true);
        setComment('');
      }
    } catch (err) {
      alert("Gagal mengirim ulasan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'validasi': return 'bg-yellow-100 text-yellow-800';
      case 'tervalidasi': return 'bg-blue-100 text-blue-800';
      case 'dalam proses': return 'bg-orange-100 text-orange-800';
      case 'selesai': return 'bg-green-100 text-green-800';
      case 'ditolak': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const currentStep = getCurrentStep(laporan.status);
  const steps = getTrackingSteps(laporan.status);

  // 🔥 CLEAN URL UNTUK FOTO — HANYA UNTUK PREVIEW
  const cleanImageUrl = (url) => {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
      return url;
    }
    return url
      .replace(/\/fl_attachment\//g, '/')
      .replace(/\?dl=1/g, '')
      .replace(/&dl=1/g, '')
      .replace(/\?$/, '');
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Detail Laporan</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {laporan.status === "Ditolak" ? "Status Laporan" : "Progres Laporan"}
            </h3>
            {laporan.status === "Ditolak" ? (
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <Send className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-600">Laporan Terkirim</p>
                    <p className="text-sm text-gray-600 mt-1">Laporan Anda telah berhasil dikirim ke sistem</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center border-2 border-red-500">
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-red-600">Laporan Ditolak</p>
                    <p className="text-sm text-gray-600 mt-1">Laporan tidak dapat diproses</p>
                    {laporan.alasan_penolakan && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                          <h4 className="text-sm font-medium text-red-900">Alasan Penolakan</h4>
                        </div>
                        <p className="text-sm text-red-700">{laporan.alasan_penolakan}</p>
                        <div className="mt-3 pt-3 border-t border-red-200">
                          <p className="text-xs text-red-600">
                            <span className="font-medium">Saran:</span> Anda dapat mengirim laporan baru dengan informasi yang lebih lengkap.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map(step => {
                  const isCompleted = step.id < currentStep;
                  const isCurrent = step.id === currentStep;
                  return (
                    <div key={step.id} className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted ? "bg-green-500" : isCurrent ? step.bgColor : "bg-gray-200"
                      }`}>
                        <step.icon className={`w-5 h-5 ${
                          isCompleted ? "text-white" : isCurrent ? step.color : "text-gray-400"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${
                          isCompleted ? "text-green-600" : isCurrent ? "text-gray-900" : "text-gray-500"
                        }`}>
                          {step.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                        {isCurrent && step.id === 3 && (
                          <div className="mt-3">
                            {isLoadingPetugas ? (
                              <div className="flex items-center text-sm text-gray-500">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                Memuat data petugas...
                              </div>
                            ) : petugasLaporan.length > 0 ? (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm font-medium text-blue-900 mb-2">Petugas yang Dikerahkan:</p>
                                {petugasLaporan.map(petugas => (
                                  <div key={petugas.id} className="flex items-start space-x-3 mb-2 last:mb-0">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                      <User className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-blue-800">{petugas.nama}</p>
                                      <div className="flex items-center text-xs text-blue-700 mt-1">
                                        <Phone className="w-3 h-3 mr-1" /> {petugas.nomor_telepon}
                                      </div>
                                      <div className="flex items-center text-xs text-blue-600 mt-1">
                                        <MapPin className="w-3 h-3 mr-1" /> {petugas.alamat}
                                      </div>
                                      {petugas.pivot?.dikirim_pada && (
                                        <p className="text-xs text-blue-500 mt-1">
                                          Dikirim: {formatDateTime(petugas.pivot.dikirim_pada)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-sm text-yellow-800">Menunggu penugasan petugas...</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Informasi Laporan */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Laporan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><p className="font-medium text-gray-500">Judul Laporan</p><p>{laporan.judul}</p></div>
              <div><p className="font-medium text-gray-500">Lokasi</p><p>{laporan.lokasi}</p></div>
              <div><p className="font-medium text-gray-500">Tanggal Lapor</p><p>{formatDate(laporan.created_at)}</p></div>
              <div className="md:col-span-2">
                <p className="font-medium text-gray-500">Deskripsi</p>
                <p className="text-gray-900 mt-1">{laporan.deskripsi}</p>
              </div>
              {laporan.status === "Ditolak" && laporan.alasan_penolakan && (
                <div className="md:col-span-2">
                  <p className="font-medium text-gray-500">Alasan Penolakan</p>
                  <div className="mt-1 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">{laporan.alasan_penolakan}</p>
                    <p className="text-xs text-red-600 mt-2">
                      <span className="font-medium">Catatan:</span> Laporan ini tidak dapat diproses lebih lanjut. Silakan kirim laporan baru dengan informasi yang lebih lengkap.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Foto Laporan */}
          {laporan.foto_laporan?.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Foto Laporan</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {laporan.foto_laporan.map((foto, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={foto}
                      alt={`Foto laporan ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                      onClick={() => window.open(cleanImageUrl(foto), "_blank")} // ✅ FIX DI SINI
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML =
                          '<div class="w-full h-24 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">' +
                          '<p class="text-gray-500 text-xs">Gambar tidak ditemukan</p>' +
                          '</div>';
                      }}
                    />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      Foto {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🔥 BUKTI PERBAIKAN + RATING (Hanya untuk Selesai) */}
          {laporan.status === "Selesai" && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Bukti Perbaikan dari Petugas
              </h3>

              {/* Foto Bukti */}
              {laporan.foto_bukti_perbaikan?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <Camera className="w-4 h-4 mr-2" />
                    Foto Hasil Perbaikan
                    <span className="ml-2 text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      {laporan.foto_bukti_perbaikan.length} foto
                    </span>
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {laporan.foto_bukti_perbaikan.map((foto, index) => {
                      if (!foto || typeof foto !== 'string') return null;
                      return (
                        <div key={index} className="relative group">
                          <img
                            src={foto}
                            alt={`Bukti perbaikan ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-green-200 cursor-pointer hover:opacity-80"
                            onClick={() => window.open(cleanImageUrl(foto), "_blank")} // ✅ FIX DI SINI
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML =
                                '<div class="w-full h-32 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">' +
                                '<p class="text-red-600 text-xs">Gambar tidak ditemukan</p>' +
                                '</div>';
                            }}
                          />
                          <div className="absolute bottom-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                            Bukti {index + 1}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Foto dokumentasi hasil perbaikan fasilitas oleh petugas
                  </p>
                </div>
              )}

              {/* PDF */}
              {laporan.rincian_biaya_pdf && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Rincian Biaya Perbaikan
                  </h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <FileText className="w-8 h-8 text-green-600 mr-3" />
                      <div className="flex-1">
                        <p className="text-green-800 font-medium">Dokumen Rincian Biaya</p>
                        <p className="text-sm text-green-600 mt-1">
                          Dokumen PDF berisi rincian biaya perbaikan fasilitas
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadFile(laporan.rincian_biaya_pdf, `rincian-biaya-${laporan.id}.pdf`)}
                    className="bg-green-600 text-white px-4 py-2 rounded w-full flex items-center justify-center cursor-pointer"
                  >
                    <Download className="mr-2" /> Download Rincian Biaya (PDF)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 🔥 FORM RATING + KOMENTAR */}
          {laporan.status === "Selesai" && (
            <div className="mb-6 p-4 rounded-lg bg-blue-50">
              <h4 className="font-medium mb-2">Beri Rating untuk Perbaikan Ini</h4>

              {isRated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-2xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  <div className="space-y-3">
                  {/* Komentar User */}
                    {comment ? (
                      <div className="bg-white p-3 rounded border border-gray-200 text-sm">
                        <p className="text-gray-800 whitespace-pre-wrap">{comment}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic text-sm">Tidak ada ulasan</p>
                    )}

                    {/* 🔥 Balasan Admin */}
                    {adminReply && (
                      <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
                        <div className="flex items-center mb-1">
                          <Users className="w-4 h-4 text-blue-600 mr-2" />
                          <span className="font-medium text-blue-700">Balasan Admin</span>
                          {adminRepliedAt && (
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(adminRepliedAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-800 whitespace-pre-wrap">{adminReply}</p>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 italic">
                    Ulasan telah dikirim. Tidak dapat diedit kembali.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        disabled={isSubmitting}
                        className={`text-2xl transition-colors ${
                          star <= rating 
                            ? 'text-yellow-500 hover:text-yellow-600' 
                            : 'text-gray-300 hover:text-gray-400'
                        }`}
                        aria-label={`Berikan rating ${star} bintang`}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={comment}
                    onChange={(e) => !isRated && setComment(e.target.value)}
                    placeholder="Tulis ulasan Anda (opsional)..."
                    className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isRated 
                        ? 'bg-gray-50 border-gray-300 text-gray-700 cursor-default' 
                        : 'bg-white border-gray-300 focus:ring-blue-500'
                    }`}
                    rows="2"
                    maxLength="1000"
                    readOnly={isRated}
                    disabled={isSubmitting}
                  />

                  <button
                    onClick={handleRate}
                    disabled={isSubmitting || rating === 0 || isRated}
                    className={`mt-3 px-4 py-2 rounded font-medium ${
                      rating === 0 || isRated
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                    }`}
                  >
                    {isSubmitting ? 'Mengirim...' : isRated ? 'Telah Dirating' : 'Kirim Ulasan'}
                  </button>

                  {isSubmitting && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Mengirim ulasan...
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Action untuk laporan ditolak */}
          {laporan.status === "Ditolak" && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                Apa yang harus dilakukan?
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-3">Jika laporan Anda ditolak, Anda dapat:</p>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Periksa alasan penolakan di atas</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Perbaiki informasi yang kurang lengkap</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Kirim laporan baru dengan foto yang lebih jelas</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Pastikan lokasi yang dilaporkan spesifik</span>
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <button
                    onClick={() => {
                      onClose();
                      window.location.href = '/LaporPage';
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
                  >
                    Kirim Laporan Baru
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailLaporanModal;