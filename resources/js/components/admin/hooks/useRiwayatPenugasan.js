import { useState, useEffect } from "react";
import axios from "axios";

export const useRiwayatPenugasan = () => {
    const [riwayatData, setRiwayatData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});

    const fetchRiwayat = async (page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("admin_token");
            const res = await axios.get(
                `http://localhost:8000/api/admin/riwayat-penugasan?page=${page}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (res.data.success) {
                setRiwayatData(res.data.data);
                setPagination(res.data.pagination);
            }
        } catch (err) {
            console.error("Gagal ambil riwayat:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRiwayat();
    }, []);

    return { riwayatData, loading, pagination, fetchRiwayat };
};