import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import {  login, fetchProfile } from "./authService";


const useLogin = () => {
  const { user, setUser, isAuth, setIsAuth } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      const profile = await fetchProfile();
      if (profile) {
        console.log("✅ [useLogin] Fetched profile:", profile);
        setUser(profile);
        setIsAuth(true);
        localStorage.setItem("userProfile", JSON.stringify(profile));
      }
      setLoading(false);
    };

    loadUserProfile();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      // 1️⃣ **Login để lấy token**
      const loginResult = await login({ email, password });

      if (!loginResult.success) {
        return { success: false, message: loginResult.message };
      }

      // 2️⃣ **Fetch profile ngay sau khi login**
      const profile = await fetchProfile();
      console.log("✅ [useLogin] Profile after login:", profile);

      if (!profile || !profile.roles) {
        return { success: false, message: "Không thể lấy thông tin user" };
      }

      // 3️⃣ **Cập nhật state & localStorage**
      setUser(profile);
      setIsAuth(true);
      localStorage.setItem("userProfile", JSON.stringify(profile));

      return { success: true, user: profile };
    } catch (error) {
      console.error("❌ [useLogin] Lỗi khi đăng nhập:", error);
      return { success: false, message: "Lỗi hệ thống, vui lòng thử lại." };
    }
  };

  return { user, isAuth, handleLogin, loading };
};

export default useLogin;
