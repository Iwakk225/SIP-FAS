import React, { useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function NotificationPopup({ notification }) {
    if (!notification.show) return null;

    const bgColor = {
        success: "bg-green-500",
        error: "bg-red-500",
        warning: "bg-yellow-500",
    };

    const icon = {
        success: <CheckCircle className="w-5 h-5" />,
        error: <XCircle className="w-5 h-5" />,
        warning: <AlertTriangle className="w-5 h-5" />,
    };

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
            <div
                className={`${
                    bgColor[notification.type]
                } text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 min-w-80`}
            >
                {icon[notification.type]}
                <span className="font-medium">{notification.message}</span>
            </div>
        </div>
    );
}