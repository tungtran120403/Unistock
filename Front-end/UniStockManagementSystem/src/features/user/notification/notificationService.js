import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/user/notification`;

const authHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Lấy danh sách thông báo chưa đọc
export const fetchUnreadNotifications = async () => {
    try {
        const response = await axios.get(`${API_URL}/unread`, {
            headers: authHeader(),
        });
        console.log("✅ [fetchUnreadNotifications] API Response:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Lỗi khi lấy thông báo chưa đọc:", error.response?.data || error.message);
        throw error;
    }
};

// Đánh dấu thông báo là đã đọc
export const markNotificationAsRead = async (notificationId) => {
    try {
        const response = await axios.post(
            `${API_URL}/${notificationId}/read`,
            {},
            { headers: authHeader() }
        );
        console.log(`✅ [markNotificationAsRead] Notification ID: ${notificationId}`);
        return response.data;
    } catch (error) {
        console.error("❌ Lỗi khi đánh dấu thông báo đã đọc:", error.response?.data || error.message);
        throw error;
    }
};

// (Optional) Xóa thông báo nếu cần
export const deleteNotification = async (notificationId) => {
    try {
        const response = await axios.delete(`${API_URL}/${notificationId}`, {
            headers: authHeader(),
        });
        console.log(`✅ [deleteNotification] Deleted Notification ID: ${notificationId}`);
        return response.data;
    } catch (error) {
        console.error("❌ Lỗi khi xóa thông báo:", error.response?.data || error.message);
        throw error;
    }
};
