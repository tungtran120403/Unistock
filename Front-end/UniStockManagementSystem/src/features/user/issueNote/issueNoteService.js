import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/user/issuenote`; // ✅ API Sale Orders

// ✅ Hàm để lấy Token từ LocalStorage
const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 🟢 **Lấy danh sách Sale Orders (Hỗ trợ phân trang)**
export const getSaleOrders = async (page, size) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/sale-orders`, {
      params: { page, size },
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("❌ [getSaleOrders] Lỗi khi lấy danh sách đơn hàng:", error);
    throw error;
  }
};

export const getMaterials = async (page, size) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/materials`, {
      params: { page, size },
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách vật tư:", error);
    throw error;
  }
};

export const getProducts = async (page, size) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/products`, {
      params: { page, size },
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", error);
    throw error;
  }
};

export const getIssueNotes = async (page, size) => {
  try {
    const response = await axios.get(API_URL, {
      params: { page, size },
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("❌ [getIssueNotes] Lỗi khi lấy danh sách phiếu xuất kho:", error);
    throw error;
  }
};


export const createIssueNote = async (issueNote) => {
    try {
      const response = await axios.post(API_URL, issueNote, {
        headers: { ...authHeader(), "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tạo phiếu xuất kho:", error);
      throw error;
    }
  };

  export const getNextCode = async () => {
    try {
      const response = await axios.get(`${API_URL}/nextcode`, {
        headers: authHeader(),
      });
      return response.data; 
    } catch (error) {
      console.error("Lỗi khi tạo mã phiếu xuất kho mới:", error);
      throw error;
    }
  };

  export const uploadPaperEvidence = async (noteId, noteType, files) => {
    try {
      const formData = new FormData();
      formData.append("noteId", noteId);
      formData.append("noteType", noteType);
      
      // Append multiple files
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      
      const response = await axios.post(`${API_URL}/upload-documents`, formData, {
        headers: { 
          ...authHeader(),
          'Content-Type': 'multipart/form-data'
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error uploading files:", error);
      throw error;
    }
  };

  export const getIssueNote = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`, {
        headers: authHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("❌ [getIssueNote] Lỗi khi lấy chi tiết phiếu xuất kho:", error);
      throw error;
    }
  };


  export const getTotalQuantityOfMaterial = async (materialId, salesOrderId = null) => {
    try {
      const params = new URLSearchParams();
      if (salesOrderId !== null) {
        params.append('salesOrderId', salesOrderId);
      }
  
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/user/inventory/material/${materialId}/warehouses`,
        {
          headers: authHeader(),
          params: params,
        }
      );
      return response.data;
    } catch (error) {
      console.error("❌ [getTotalQuantityOfMaterial] Lỗi khi lấy tồn kho vật tư:", error);
      throw error;
    }
  };
  
  // 🟢 **Lấy tồn kho sản phẩm theo kho**
  export const getTotalQuantityOfProduct = async (productId, salesOrderId = null) => {
    try {
      const params = new URLSearchParams();
      if (salesOrderId !== null) {
        params.append('salesOrderId', salesOrderId);
      }
  
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/user/inventory/product/${productId}/warehouses`,
        {
          headers: authHeader(),
          params: params,
        }
      );
      return response.data;
    } catch (error) {
      console.error("❌ [getTotalQuantityOfProduct] Lỗi khi lấy tồn kho sản phẩm:", error);
      throw error;
    }
  };