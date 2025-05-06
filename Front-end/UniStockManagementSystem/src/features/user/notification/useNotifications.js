import { useState, useEffect } from "react";
import { fetchUnreadNotifications, markNotificationAsRead } from "../notification/notificationService";
import { useAuth } from "@/context/AuthContext";

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const fetchNotifications = async () => {
        console.log("🔄 Fetching notifications...");
        setLoading(true);
        try {
            const data = await fetchUnreadNotifications();
            console.log("✅ Data fetched:", data);
            setNotifications(data);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setLoading(false);
        }
    };


    const markAsRead = async (notificationId) => {
        try {
            await markNotificationAsRead(notificationId);
            setNotifications((prev) => prev.filter((n) => n.notificationId !== notificationId));
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    useEffect(() => {
        console.log("🔍 Fetching notifications (no token dep)...");
        fetchNotifications();
    }, []);

    return {
        notifications,
        unreadCount: notifications.length,
        loading,
        fetchNotifications,
        markAsRead,
    };
};
