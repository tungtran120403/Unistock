import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/user/partner/type`;

const authHeader = () => {
    const token = localStorage.getItem("token");
  
    if (!token) {
      console.warn("🚨 Không tìm thấy token trong localStorage!");
      return {};
    }
  
    console.log("🔑 Gửi Token:", token);
    return { Authorization: `Bearer ${token}` };
  };

export const getPartnerTypes = async () => {
  try {
    const headers = authHeader();
    console.log("📢 [getPartnerTypes] Headers:", headers);
    const response = await axios.get(API_URL, { headers });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch partner types", error);
    if (error.response) {
        console.error("🔴 [getPartnerTypes] Response Data:", error.response.data);
        console.error("🔴 [getPartnerTypes] Status Code:", error.response.status);
        console.error("🔴 [getPartnerTypes] Headers:", error.response.headers);
      }
  
      throw error;
  }
};

export const createPartnerType = async (partnerType, token) => {
  const response = await axios.post(`${API_URL}/add`, partnerType, {
    headers: authHeader(),
  });

  console.log("✅ Kết quả từ Server:", response.data);
  return response.data;
};

export const updatePartnerType = async (partnerType, token) => {

  const response = await axios.put(`${API_URL}/edit/${partnerType.typeId}`, partnerType, {
    headers: authHeader(),
  });

  console.log("✅ Kết quả từ Server:", response.data);
  return response.data;
};

export const togglePartnerTypeStatus = async (typeId, newStatus) => {
  try {
    const response = await axios.patch(
      `${API_URL}/${typeId}/status`,
      { status: newStatus },
      { headers: authHeader() }
    );
    console.log("✅ API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật trạng thái:", error);
    throw error;
  }
};