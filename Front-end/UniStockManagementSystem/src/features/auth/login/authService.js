import axios from "axios";
import { jwtDecode } from "jwt-decode";

const API_URL = `${import.meta.env.VITE_API_URL}/auth`;

// 🟢 **Cấu hình axios**
const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// 🟢 **Hàm Đăng nhập**
export const login = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || "Lỗi đăng nhập: Sai email hoặc mật khẩu");
    }

    const loginData = await response.json();
    console.log("📢 API Login Response:", loginData);

    if (!loginData.token) {
      throw new Error("Token không hợp lệ từ server");
    }

    // ✅ Lưu token vào localStorage
    localStorage.setItem("token", loginData.token);

    // 🟢 Gọi API `/me` để lấy thông tin đầy đủ của user
    const profile = await fetchProfile();
    if (profile) {
      localStorage.setItem("userProfile", JSON.stringify(profile));
      return { success: true, user: profile };
    } else {
      throw new Error("Không thể lấy profile user");
    }
  } catch (error) {
    console.error("🚨 Lỗi đăng nhập:", error.message);
    return { success: false, message: error.message };
  }
};

// 🟢 **Hàm Đăng xuất**
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userProfile"); // ✅ Xoá thông tin user thay vì `user`
};

// 🟢 **Lấy user từ LocalStorage**
export const getUser = () => {
  const storedUser = localStorage.getItem("userProfile");
  console.log("📢 getUser() - Raw data from localStorage:", storedUser);

  try {
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("❌ Lỗi parse JSON từ localStorage:", error);
    return null;
  }
};

// 🟢 **Kiểm tra đăng nhập**
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 > Date.now();
  } catch (error) {
    console.error("🚨 Lỗi kiểm tra Token:", error);
    return false;
  }
};

// 🟢 **Gọi API `/me` để lấy profile user**
export const fetchProfile = async () => {
  try {
    console.log("===> fetchProfile called");

    const response = await apiClient.get("/me");
    console.log("===> fetchProfile success, data =", response.data);

    return response.data;
  } catch (error) {
    console.error("🚨 Lỗi lấy thông tin user:", error.message);
    return null;
  }
};

// 🟢 **Tự động gửi token trong tất cả các request API**
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
