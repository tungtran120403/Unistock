import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/admin/users`; // ✅ API cho User Management

// ✅ Hàm để lấy Token từ LocalStorage
const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {}; // ✅ Nếu không có token, trả về object rỗng
};

// 🟢 **API Tạo User**
export const createUser = async (userData) => {
  try {
    const response = await axios.post(API_URL, userData, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });
    console.log("✅ [createUser] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ [createUser] Lỗi khi tạo user:", error);
    throw error;
  }
};


// ✅ API kiểm tra email
export const checkEmailExists = async (email) => {
  try {
    const response = await axios.get(`${API_URL}/check-email`, {
      params: { email },
      headers: authHeader(), // ✅ Gửi token cùng request
    });
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi kiểm tra email:", error);
    return false;
  }
};

// 🟢 **Lấy danh sách Users**
export const getUsers = async (page,size) => {
  try {
    const response = await axios.get(API_URL, {params: { page, size }, headers: authHeader() });
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách Users:", error);
    throw error;
  }
};

// 🔴 **Xóa user theo ID**
export const deleteUserById = async (userId) => {
  try {
    await axios.delete(`${API_URL}/${userId}`, { headers: authHeader() });
  } catch (error) {
    console.error("❌ Lỗi khi xóa User:", error);
    throw error;
  }
};

// 🔄 **Toggle trạng thái `isActive` của User**
export const toggleUserStatus = async (userId, newStatus) => {
  try {
    const response = await axios.patch(
      `${API_URL}/${userId}/status`,
      { isActive: newStatus }, // ✅ Gửi trạng thái mới
      { headers: authHeader() }
    );
    console.log("✅ API Response:", response.data); // Debug API
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật trạng thái:", error);
    throw error;
  }
};

// 🟢 **Cập nhật User**
export const updateUser = async (userId, updatedUser) => {
  try {
    const response = await axios.put(`${API_URL}/${userId}`, updatedUser, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });
    console.log("✅ [updateUser] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ [updateUser] Lỗi khi cập nhật user:", error);
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/${userId}`, {
      headers: authHeader(),
    });

    console.log("✅ [getUserById] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ [getUserById] Lỗi khi lấy thông tin user:", error);
    throw error;
  }
};