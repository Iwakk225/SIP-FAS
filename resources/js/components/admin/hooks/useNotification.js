import { useState } from "react";

export const useNotification = () => {
    const [notification, setNotification] = useState({
        show: false,
        message: "",
        type: "success",
    });

    const showNotification = (message, type = "success") => {
        setNotification({
            show: true,
            message,
            type,
        });

        // Auto hide setelah 3 detik
        setTimeout(() => {
            setNotification({
                show: false,
                message: "",
                type: "success",
            });
        }, 3000);
    };

    return {
        notification,
        showNotification,
    };
};