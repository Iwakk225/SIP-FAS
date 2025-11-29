import { useState, useEffect } from "react";
import axios from "axios";

export const usePetugasData = () => {
    const [petugasData, setPetugasData] = useState([]);

    const fetchPetugasData = async () => {
        try {
            const token = localStorage.getItem("admin_token");
            const response = await axios.get("http://localhost:8000/api/admin/petugas", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            console.log("Data petugas:", response.data);
            setPetugasData(response.data.data || response.data);
        } catch (error) {
            console.error("Error fetching petugas data:", error);
        }
    };

    useEffect(() => {
        fetchPetugasData();
    }, []);

    return {
        petugasData,
        fetchPetugasData,
    };
};