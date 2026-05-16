import { useState, useEffect } from "react";
import axios from "axios";

export const useLaporanData = () => {
    const [laporanData, setLaporanData] = useState([]);
    const [statsData, setStatsData] = useState({
        total: 0,
        validated: 0,
        waiting: 0,
        inProgress: 0,
        completed: 0,
        rejected: 0,
    });
    const [wilayahData, setWilayahData] = useState([
        { name: "Surabaya Barat", laporan: 0 },
        { name: "Surabaya Timur", laporan: 0 },
        { name: "Surabaya Utara", laporan: 0 },
        { name: "Surabaya Selatan", laporan: 0 },
        { name: "Surabaya Pusat", laporan: 0 },
    ]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const formatTimeAgo = (dateString) => {
        if (!dateString) return "Beberapa waktu yang lalu";

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Baru saja";
        if (diffMins < 60) return `${diffMins} menit yang lalu`;
        if (diffHours < 24) return `${diffHours} jam yang lalu`;
        if (diffDays < 7) return `${diffDays} hari yang lalu`;

        return date.toLocaleDateString("id-ID");
    };

    const fetchLaporanData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("admin_token");

            if (!token) {
                console.error("No admin token found");
                return;
            }

            const response = await axios.get("http://localhost:8000/api/admin/laporan", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                timeout: 10000,
            });

            const laporanArray = response.data.data || response.data;

            if (!Array.isArray(laporanArray)) {
                console.error("Invalid data format:", laporanArray);
                return;
            }

            const normalizeStatus = (status) =>
                (status || "").toString().toLowerCase().replace(/[_\s]+/g, " ").trim();

            // Update stats data
            let total = laporanArray.length;
            let validated = 0;
            let waiting = 0;
            let inProgress = 0;
            let completed = 0;
            let rejected = 0;

            laporanArray.forEach((laporan) => {
                const status = normalizeStatus(laporan.status);
                if (status === "tervalidasi" || status === "validated") validated++;
                else if (status === "validasi" || status === "menunggu") waiting++;
                else if (status === "dalam proses" || status === "in progress" || status === "in_progress") inProgress++;
                else if (status === "selesai" || status === "completed") completed++;
                else if (status === "ditolak" || status === "rejected") rejected++;
            });

            setStatsData({
                total,
                validated,
                waiting,
                inProgress,
                completed,
                rejected,
            });

            // Update data per wilayah
            const wilayahCount = {
                "Surabaya Barat": 0,
                "Surabaya Timur": 0,
                "Surabaya Utara": 0,
                "Surabaya Selatan": 0,
                "Surabaya Pusat": 0,
                "Lokasi Lain": 0,
            };

            laporanArray.forEach((laporan) => {
                const lokasi = laporan.lokasi || "";
                const lokasiLower = lokasi.toLowerCase();

                if (lokasiLower.includes("barat")) wilayahCount["Surabaya Barat"]++;
                else if (lokasiLower.includes("timur")) wilayahCount["Surabaya Timur"]++;
                else if (lokasiLower.includes("utara")) wilayahCount["Surabaya Utara"]++;
                else if (lokasiLower.includes("selatan")) wilayahCount["Surabaya Selatan"]++;
                else if (lokasiLower.includes("pusat") || lokasiLower.includes("tengah"))
                    wilayahCount["Surabaya Pusat"]++;
                else {
                    wilayahCount["Surabaya Pusat"]++;
                }
            });

            setWilayahData([
                { name: "Surabaya Barat", laporan: wilayahCount["Surabaya Barat"] },
                { name: "Surabaya Timur", laporan: wilayahCount["Surabaya Timur"] },
                { name: "Surabaya Utara", laporan: wilayahCount["Surabaya Utara"] },
                { name: "Surabaya Selatan", laporan: wilayahCount["Surabaya Selatan"] },
                { name: "Surabaya Pusat", laporan: wilayahCount["Surabaya Pusat"] },
            ]);

            setLaporanData(laporanArray);

            // Generate recent activities
            const sortedLaporan = [...laporanArray]
                .sort(
                    (a, b) =>
                        new Date(b.created_at || b.tanggal) -
                        new Date(a.created_at || a.tanggal)
                )
                .slice(0, 3);

            const activities = sortedLaporan.map((laporan) => {
                let activity = {};
                const status = laporan.status?.toLowerCase();

                if (status === "validasi" || status === "pending") {
                    activity = {
                        type: "Laporan baru diterima",
                        description: laporan.judul,
                        time: formatTimeAgo(laporan.created_at),
                    };
                } else if (status === "tervalidasi" || status === "validated") {
                    activity = {
                        type: "Laporan divalidasi",
                        description: laporan.judul,
                        time: formatTimeAgo(laporan.created_at),
                    };
                } else if (
                    status === "dalam_proses" ||
                    status === "dalam proses" ||
                    status === "in_progress"
                ) {
                    activity = {
                        type: "Petugas dikirim",
                        description: laporan.judul,
                        time: formatTimeAgo(laporan.created_at),
                    };
                } else {
                    activity = {
                        type: "Laporan diproses",
                        description: laporan.judul,
                        time: formatTimeAgo(laporan.created_at),
                    };
                }
                return activity;
            });

            setRecentActivities(activities);
        } catch (error) {
            console.error("Error fetching laporan data:", error);

            try {
                const storedLaporan = localStorage.getItem("laporan_data");
                if (storedLaporan) {
                    const laporanArray = JSON.parse(storedLaporan);

                    const normalizeStatus = (status) =>
                        (status || "").toString().toLowerCase().replace(/[_\s]+/g, " ").trim();

                    const total = laporanArray.length;
                    let validated = 0;
                    let waiting = 0;
                    let inProgress = 0;
                    let completed = 0;
                    let rejected = 0;

                    laporanArray.forEach((laporan) => {
                        const status = normalizeStatus(laporan.status);
                        if (status === "tervalidasi" || status === "validated") validated++;
                        else if (status === "validasi" || status === "menunggu") waiting++;
                        else if (status === "dalam proses" || status === "in progress" || status === "in_progress") inProgress++;
                        else if (status === "selesai" || status === "completed") completed++;
                        else if (status === "ditolak" || status === "rejected") rejected++;
                    });

                    setStatsData({ total, validated, waiting, inProgress, completed, rejected });
                    setLaporanData(laporanArray);
                }
            } catch (fallbackError) {
                console.error("Error fallback ke localStorage:", fallbackError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLaporanData();

        const interval = setInterval(fetchLaporanData, 30000);

        return () => clearInterval(interval);
    }, []);

    return {
        laporanData,
        statsData,
        wilayahData,
        recentActivities,
        isLoading,
        fetchLaporanData,
    };
};