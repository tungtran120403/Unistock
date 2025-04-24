import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";


const API_URL = `${import.meta.env.VITE_API_URL}/user/partner`;
const TYPE_API = `${import.meta.env.VITE_API_URL}/user/partner/type`;
const CODE_API = `${import.meta.env.VITE_API_URL}/user/partner/code`;

const authHeader = () => {
    const token = localStorage.getItem("token");

    if (!token) {
        console.warn("🚨 Không tìm thấy token trong localStorage!");
        return {};
    }

    console.log("🔑 Gửi Token:", token);
    return { Authorization: `Bearer ${token}` };
};

// ✅ Lấy danh sách tất cả đối tác
export const getAllPartners = async (page = 0, size = 10) => {
    try {
        const headers = authHeader();
        console.log("📢 [getPartners] Headers:", headers);
        const response = await axios.get(`${API_URL}/list`, {
            headers: authHeader(),
            params: {
                page: page,
                size: size
            }
        });
        console.log("📌 [getAllProducts] API Response:", response.data);

        // Kiểm tra dữ liệu trả về từ API
        if (response.data && response.data.content) {
            return {
                partners: response.data.content,
                totalPages: response.data.totalPages || 1,
                totalElements: response.data.totalElements || response.data.content.length
            };
        } else {
            console.warn("⚠️ API không trả về dữ liệu hợp lệ!");
            return {
                partners: [],
                totalPages: 1,
                totalElements: 0
            };
        }
    } catch (error) {
        console.error("Failed to fetch partners", error);
        if (error.response) {
            console.error("🔴 [getPartners] Response Data:", error.response.data);
            console.error("🔴 [getPartners] Status Code:", error.response.status);
            console.error("🔴 [getPartners] Headers:", error.response.headers);
        }

        throw error;
    }
};

export const fetchPartnerTypes = async () => {
    try {
        const headers = authHeader();
        console.log("📢 [getPartnerTypes] Headers:", headers);
        const response = await axios.get(TYPE_API, { headers });
        return response.data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách nhóm đối tác:', error);
        if (error.response) {
            console.error("🔴 [getPartnerTypes] Response Data:", error.response.data);
            console.error("🔴 [getPartnerTypes] Status Code:", error.response.status);
            console.error("🔴 [getPartnerTypes] Headers:", error.response.headers);
        }
        throw error;
    }
};

export const createPartner = async (partner) => {
    const response = await axios.post(`${API_URL}/add`, partner, {
        headers: authHeader(),
    });

    console.log("✅ Kết quả từ Server:", response.data);
    return response.data;
};

export const getPartnerCodeByType = async (typeId) => {
    try {
        const headers = authHeader();
        const response = await axios.get(`${CODE_API}/${typeId}`, { headers });
        return response.data; // Trả về mã đối tác đã được tạo
    } catch (error) {
        console.error("Lỗi khi lấy mã đối tác:", error);
        throw error;
    }
};

export const getPartnersByType = async (typeId, page , size ) => {
    try {
        const headers = authHeader();
        const response = await axios.get(`${API_URL}/list/type=${typeId}`, {
            headers,
            params: { page, size },
        });
        return {
            partners: response.data.content,
            totalPages: response.data.totalPages || 1,
            totalElements: response.data.totalElements || response.data.content.length
        };
    } catch (error) {
        console.error("Lỗi khi lấy đối tác theo loại:", error);
        throw error;
    }
};

export const updatePartner = async (partner) => {
    try {
        const response = await axios.put(`${API_URL}/update/${partner.partnerId}`, partner, {
            headers: authHeader(),
        });

        console.log("✅ [updatePartner] Kết quả từ Server:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Lỗi khi cập nhật đối tác:", error);
        if (error.response) {
            console.error("🔴 [updatePartner] Response Data:", error.response.data);
            console.error("🔴 [updatePartner] Status Code:", error.response.status);
            console.error("🔴 [updatePartner] Headers:", error.response.headers);
        }
        throw error;
    }
};

export const getPartnersByMaterial = async (materialId) => {
    try {
      const response = await axios.get(`${API_URL}/by-material/${materialId}`, {
        headers: authHeader(),
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("❌ [getPartnersByMaterial] Error:", error);
      throw error;
    }
  };

  export const getPartnersByCodePrefix = async (prefix = "KH") => {
    try {
      const headers = authHeader();
      const response = await axios.get(`${API_URL}/code-prefix`, {
        headers,
        params: { prefix }
      });
      return response.data;
    } catch (error) {
      console.error("❌ [getPartnersByCodePrefix] Error:", error);
      throw error;
    }
  };
  

