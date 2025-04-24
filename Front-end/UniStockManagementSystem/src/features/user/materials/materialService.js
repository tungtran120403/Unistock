import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const API_URL = `${import.meta.env.VITE_API_URL}/user/materials`;

// Hàm để lấy Token từ LocalStorage
const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Lấy danh sách nguyên vật liệu phân trang
export const getAllMaterials = async (page = 0, size = 10) => {
  try {
    const response = await axios.get(API_URL, {
      headers: authHeader(),
      params: {
        page: page,
        size: size,
      },
    });

    console.log("📌 [getAllMaterials] API Response:", response.data);

    if (response.data && response.data.content) {
      // 🔄 Lấy danh mục loại vật tư và đảm bảo là mảng
      const rawCategories = await fetchMaterialCategories();
      const categories = Array.isArray(rawCategories.content)
        ? rawCategories.content
        : Array.isArray(rawCategories)
          ? rawCategories
          : [];

      // ✅ Gắn tên danh mục cho từng vật tư
      const materials = response.data.content.map((material) => {
        let typeName = material.typeName || "Không có danh mục";
        if (material.typeId) {
          const category = categories.find(
            (cat) => cat.materialTypeId === material.typeId
          );
          typeName = category ? category.name : typeName;
        }
        return {
          ...material,
          typeName,
        };
      });

      return {
        materials,
        totalPages: response.data.totalPages || 1,
        totalElements:
          response.data.totalElements || response.data.content.length,
      };
    } else {
      console.warn("⚠️ API không trả về dữ liệu hợp lệ!");
      return {
        materials: [],
        totalPages: 1,
        totalElements: 0,
      };
    }
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách nguyên vật liệu:", error);
    throw error;
  }
};


// Lấy nguyên vật liệu theo ID
export const getMaterialById = async (materialId) => {
  try {
    const response = await axios.get(`${API_URL}/${materialId}`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy nguyên vật liệu có ID ${materialId}:`, error);
    throw error;
  }
};

// Tạo nguyên vật liệu mới
export const createMaterial = async (formData) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/user/materials/create`,
      formData,
      {
        headers: {
          ...authHeader(),
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("✅ [createMaterial] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi tạo nguyên vật liệu:", error.response?.data || error.message);
    throw error;
  }
};

// Cập nhật nguyên vật liệu
export const updateMaterial = async (id, formData) => {
  try {
    const response = await axios.put(
      `${API_URL}/${id}`,
      formData,
      {
        headers: {
          ...authHeader(),
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log("✅ [updateMaterial] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật nguyên vật liệu:", error);
    throw error;
  }
};

// Thay đổi trạng thái nguyên vật liệu
export const toggleMaterialStatus = async (materialId) => {
  try {
    const response = await axios.patch(
      `${API_URL}/${materialId}/toggle-status`,
      {},
      { headers: authHeader() }
    );
    console.log("✅ [toggleMaterialStatus] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi thay đổi trạng thái nguyên vật liệu:", error);
    throw error;
  }
};


// Lấy danh sách danh mục nguyên vật liệu
export const fetchMaterialCategories = async () => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/user/material-types`,
      {
        headers: authHeader(),
      }
    );
    console.log("Fetched material categories:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách danh mục nguyên vật liệu:", error);
    throw error;
  }
};

// Kiểm tra mã nguyên vật liệu đã tồn tại
export const checkMaterialCodeExists = async (materialCode, excludeId = null) => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/user/materials/check-material-code/${materialCode}`,
      { headers: authHeader(), params: { excludeId } }
    );
    console.log("📌 [checkMaterialCodeExists] API Response:", response.data);
    return response.data.exists;
  } catch (error) {
    console.error("❌ Lỗi kiểm tra mã nguyên vật liệu:", error.response?.data || error.message);
    throw error;
  }
};

// Preview import vật tư
export const previewImport = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      `${API_URL}/preview-import`,
      formData,
      {
        headers: {
          ...authHeader(),
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("✅ [previewImport] Xem trước dữ liệu thành công:", response.data);
    return response.data; // Mảng MaterialPreviewDTO
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra file:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Lỗi khi xem trước dữ liệu từ file");
  }
};

// Import Excel
export const importExcel = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      `${API_URL}/import`,
      formData,
      {
        headers: {
          ...authHeader(),
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("✅ [importExcel] Import thành công:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi import file:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Lỗi khi import file");
  }
};

// Export Excel
export const exportExcel = async () => {
  try {
    const response = await axios.get(`${API_URL}/export`, {
      headers: authHeader(),
      responseType: "blob",
    });
    console.log("✅ [exportExcel] Xuất file Excel vật tư thành công");
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi xuất Excel vật tư:", error.response?.data || error.message);
    throw error;
  }
};

//lấy danh sách các vật liệu đang sử dụng
export const getAllActiveMaterials = async () => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/user/materials/active`,
      { headers: authHeader() }
    );
    return response.data; // Danh sách nguyên vật liệu đang sử dụng
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách nguyên vật liệu đang sử dụng:", error);
    throw error;
  }
};




// Tải template vật tư
export const downloadMaterialTemplate = async () => {
  try {
    const response = await axios.get(`${API_URL}/template`, {
      responseType: "blob", // Để nhận dữ liệu nhị phân
      headers: authHeader(),
    });
    console.log("✅ [downloadMaterialTemplate] Tải template thành công");
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi tải template:", error.response?.data || error.message);
    throw error;
  }
};
