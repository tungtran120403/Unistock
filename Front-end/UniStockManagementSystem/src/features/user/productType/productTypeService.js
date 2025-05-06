import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/user/product-types`;

const authHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchProductTypes = async ({ page = 0, size = 10, search, statuses } = {}) => {
    try {
        const params = new URLSearchParams();
        params.append("page", page);
        params.append("size", size);
        if (search) params.append("search", search);
        
        // Sửa lỗi: Xử lý tham số statuses đúng cách
        if (Array.isArray(statuses)) {
            if (statuses.length === 1) {
                params.append("status", statuses[0]);
            }
            // Nếu cần hỗ trợ nhiều trạng thái, có thể thêm xử lý tùy theo API backend
        }

        const response = await axios.get(`${API_URL}?${params.toString()}`, {
            headers: authHeader(),
        });
        console.log("📌 [fetchProductTypes] API Response:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Lỗi khi lấy danh sách dòng sản phẩm:", error.response?.data || error.message);
        throw error;
    }
};

export const toggleStatus = async (typeId, newStatus) => {
    try {
        const response = await axios.patch(
            `${API_URL}/${typeId}/toggle-status`,
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

export const createProductType = async (productTypeData) => {
    try {
        const response = await axios.post(API_URL, productTypeData, {
            headers: authHeader(),
        });
        console.log("✅ [createProductType] API Response:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Lỗi khi tạo dòng sản phẩm:", error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || "Lỗi khi tạo dòng sản phẩm");
    }
};

//lấy danh sách dòng sản phẩm đang hoạt động
export const fetchActiveProductTypes = async () => {
    try {
        const response = await axios.get(`${API_URL}/active`, {
            headers: authHeader(),
        });
        return response.data;
    } catch (error) {
        console.error("❌ Lỗi khi lấy danh sách dòng sản phẩm đang hoạt động:", error);
        throw error;
    }
};

export const checkTypeNameExists = async (typeName, excludeId = null) => {
    try {
        const headers = authHeader();
        if (!headers) {
            throw new Error('No authentication token');
        }

        // Chuẩn hóa typeName: loại bỏ khoảng trắng thừa
        const normalizedTypeName = typeName.trim();

        // Đảm bảo excludeId là số nếu nó tồn tại
        const params = {};
        if (excludeId !== null && excludeId !== undefined) {
            params.excludeId = Number(excludeId);
        }

        const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/user/product-types/check-type-name/${encodeURIComponent(normalizedTypeName)}`,
            {
                headers,
                params,
                withCredentials: true,
            }
        );

        return response.data.exists;
    } catch (error) {
        console.error('Lỗi khi kiểm tra tên dòng sản phẩm:', error);
        throw error;
    }
};

export const updateProductType = async (typeId, productTypeData) => {
    try {
        const headers = authHeader();
        if (!headers) {
            throw new Error("No authentication token");
        }

        const response = await axios.put(
            `${API_URL}/${typeId}`,
            productTypeData,
            { headers }
        );

        return response.data;
    } catch (error) {
        console.log("typeId:", typeId);

        console.error("Error updating product type:", error);
        throw error;
    }
};