// src/services/profileService.js
import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}`;

// Hàm để lấy Token từ LocalStorage
const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Lấy thông tin profile
export const getProfile = async () => {
  try {
    const response = await axios.get(`${API_URL}/profile`, {
      headers: authHeader(),
    });
    console.log("📌 [getProfile] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy thông tin profile:", error.response?.data || error.message);
    throw error;
  }
};

// Cập nhật thông tin profile
export const updateProfile = async (profileData) => {
  try {
    const response = await axios.put(`${API_URL}/profile`, profileData, {
      headers: authHeader(),
    });
    console.log("✅ [updateProfile] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật profile:", error.response?.data || error.message);
    throw error;
  }
};

// Đổi mật khẩu
export const changePassword = async (passwordData) => {
  try {
    const response = await axios.post(`${API_URL}/profile/change-password`, passwordData, {
      headers: authHeader(),
    });
    console.log("✅ [changePassword] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi đổi mật khẩu:", error.response?.data || error.message);
    throw error;
  }
};

// Upload ảnh đại diện
export const uploadAvatar = async (file) => {
  try {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await axios.post(`${API_URL}/profile/avatar`, formData, {
      headers: {
        ...authHeader(),
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("✅ [uploadAvatar] API Response:", response.data);
    return response.data; // Trả về URL của ảnh (chuỗi)
  } catch (error) {
    console.error("❌ Lỗi khi upload ảnh đại diện:", error.response?.data || error.message);
    throw error;
  }
};