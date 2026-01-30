// src/components/admin/sections/AdminRatingSection.jsx
import React, { useState, useEffect } from "react";
import { Star, Users, Send } from "lucide-react";
import axios from "axios";

const AdminRatingSection = ({ laporanId, adminToken, onReplySuccess }) => {
  const [ratingData, setRatingData] = useState(null);
  const [adminReply, setAdminReply] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch rating + admin reply
  useEffect(() => {
    const fetchRating = async () => {
      if (!laporanId || !adminToken) return;
      setIsLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:8000/api/laporan/${laporanId}/rating`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );
        setRatingData(res.data.rating || null);
        if (res.data.rating?.admin_reply) {
          setAdminReply(res.data.rating.admin_reply);
        }
      } catch (err) {
        console.warn("No rating found or error:", err.message);
        setRatingData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRating();
  }, [laporanId, adminToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adminReply.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `http://localhost:8000/api/admin/ratings/${laporanId}/reply`,
        { admin_reply: adminReply.trim() },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (res.data.rating) {
        setRatingData(res.data.rating);
        setAdminReply(res.data.rating.admin_reply);
        if (onReplySuccess) onReplySuccess();
      }
    } catch (err) {
      alert(`Gagal kirim balasan: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-3 text-sm text-gray-500 italic">Memuat ulasan...</div>
    );
  }

  if (!ratingData) {
    return (
      <div className="py-3 text-sm text-gray-500 italic">
        Belum ada ulasan dari pengguna.
      </div>
    );
  }

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="font-medium text-gray-900 mb-3">Ulasan Pengguna</h4>

      {/* Rating Bintang */}
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= ratingData.rating
                ? "text-yellow-500 fill-current"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Komentar User */}
      {ratingData.comment ? (
        <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm mb-4">
          <p className="text-gray-800 whitespace-pre-wrap">{ratingData.comment}</p>
        </div>
      ) : (
        <p className="text-gray-500 italic text-sm mb-4">Tidak ada komentar.</p>
      )}

      {/* Balasan Admin */}
      {ratingData.admin_reply ? (
        <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm">
          <div className="flex items-center mb-1">
            <Users className="w-4 h-4 text-blue-600 mr-2" />
            <span className="font-medium text-blue-700">Balasan Anda</span>
          </div>
          <p className="text-gray-800 whitespace-pre-wrap">
            {ratingData.admin_reply}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={adminReply}
            onChange={(e) => setAdminReply(e.target.value)}
            placeholder="Balas komentar pengguna..."
            className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="2"
            maxLength="1000"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!adminReply.trim() || isSubmitting}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 flex items-center cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Send className="w-3 h-3 mr-1 animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Send className="w-3 h-3 mr-1" />
                Balas
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default AdminRatingSection;