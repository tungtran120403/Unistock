import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/user/units`;

const authHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchUnits = async (page = 0, size = 10) => {
    try {
        const response = await axios.get(API_URL, {
            headers: authHeader(),
            params: {
                page,
                size,
            },
        });
        console.log("📌 [fetchUnits] API Response:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Lỗi khi lấy danh sách đơn vị tính:", error.response?.data || error.message);
        throw error;
    }
};

export const toggleStatus = async (unitId, newStatus) => {
    try {
        const response = await axios.patch(
            `${API_URL}/${unitId}/toggle-status`,
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

export const createUnit = async (unitData) => {
    try {
        const response = await axios.post(API_URL, unitData, {
            headers: authHeader(),
        });
        console.log("✅ [createUnit] API Response:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Lỗi khi tạo đơn vị tính:", error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || "Lỗi khi tạo đơn vị tính");
    }
};

export const updateUnit = async (unitId, unitData) => {
    try {
        console.log("Sending PUT request to URL:", `${API_URL}/${unitId}`);
        console.log("With data:", JSON.stringify(unitData));

        const response = await axios.put(`${API_URL}/${unitId}`, unitData, {
            headers: authHeader(),
        });

        console.log("✅ [updateUnit] API Response full:", response);
        console.log("✅ [updateUnit] API Response data:", response.data);

        return response.data;
    } catch (error) {
        console.error("❌ Lỗi khi cập nhật đơn vị tính:", error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || "Lỗi khi cập nhật đơn vị tính");
    }
};

export const fetchActiveUnits = async () => {
    try {
        const response = await axios.get(`${API_URL}/active`, {
            headers: authHeader(),
        });
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error("❌ Lỗi khi lấy danh sách đơn vị tính đang hoạt động:", error);
        return [];
    }
};

export const checkUnitNameExists = async (unitName, excludeId = null) => {
    try {
        const response = await axios.get(`${API_URL}/check-unit-name/${unitName}`, {
            headers: authHeader(),
            params: { excludeId },
        });
        return response.data.exists;
    } catch (error) {
        console.error("❌ Lỗi khi kiểm tra tên đơn vị tính:", error.response?.data || error.message);
        return false;
    }
};