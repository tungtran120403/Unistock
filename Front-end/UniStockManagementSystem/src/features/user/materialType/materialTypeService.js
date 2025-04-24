import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/user/material-types`;

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchMaterialTypes = async (page = 0, size = 10) => {
  try {
    const response = await axios.get(API_URL, {
      headers: authHeader(),
      params: {
        page,
        size,
      },
    });
    console.log("📌 [fetchMaterialTypes] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách loại nguyên liệu:", error.response?.data || error.message);
    throw error;
  }
};

export const toggleStatus = async (materialTypeId, newStatus) => {
  try {
    const response = await axios.patch(
      `${API_URL}/${materialTypeId}/toggle-status`,
      { status: newStatus },
      { headers: authHeader() }
    );
    console.log("✅ [toggleStatus] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi thay đổi trạng thái:", error.response?.data || error.message);
    throw error;
  }
};

export const createMaterialType = async (materialTypeData) => {
  try {
    const response = await axios.post(API_URL, materialTypeData, {
      headers: authHeader(),
    });
    console.log("✅ [createMaterialType] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi tạo loại nguyên liệu:", error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || "Lỗi khi tạo loại nguyên liệu");
  }
};

export const updateMaterialType = async (materialTypeId, materialTypeData) => {
  try {
    const response = await axios.put(
      `${API_URL}/${materialTypeId}`,
      materialTypeData,
      { headers: authHeader() }
    );
    console.log("✅ [updateMaterialType] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật loại nguyên liệu:", error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || "Lỗi khi cập nhật loại nguyên liệu");
  }
};

export const fetchActiveMaterialTypes = async () => {
  try {
    const response = await axios.get(`${API_URL}/active`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy loại nguyên vật liệu đang sử dụng:", error);
    return [];
  }
};
