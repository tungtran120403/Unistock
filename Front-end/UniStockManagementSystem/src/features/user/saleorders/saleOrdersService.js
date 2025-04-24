import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/user/sale-orders`; // ✅ API Sale Orders

// ✅ Hàm để lấy Token từ LocalStorage
const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 🟢 **Lấy danh sách Sale Orders (Hỗ trợ phân trang)**
export const getSaleOrders = async (page, size) => {
  try {
    const response = await axios.get(API_URL, {
      params: { page, size },
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("❌ [getSaleOrders] Lỗi khi lấy danh sách đơn hàng:", error);
    throw error;
  }
};

export const getNextOrderCode = async () => {
  try {
    const response = await axios.get(`${API_URL}/next-code`, {
      headers: authHeader(),
    });
    return response.data; // Mã đơn hàng, ví dụ "ĐH00003"
  } catch (error) {
    console.error("❌ [getNextOrderCode] Lỗi:", error);
    throw error;
  }
};

// 🟢 **Lấy chi tiết Sale Order theo ID**
export const getSaleOrderById = async (orderId) => {
  try {
    const response = await axios.get(`${API_URL}/${orderId}`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("❌ [getSaleOrderById] Lỗi khi lấy đơn hàng:", error);
    throw error;
  }
};


export const addSaleOrder = async (orderData) => {
  try {
    const response = await axios.post(API_URL, orderData, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("❌ [addSaleOrder] Lỗi khi thêm đơn hàng:", error);
    throw error;
  }
};

// 🔄 **Toggle trạng thái Sale Order**
export const toggleSaleOrderStatus = async (orderId, newStatus) => {
  try {
    const response = await axios.patch(
      `${API_URL}/${orderId}/status`,
      { status: newStatus },
      { headers: authHeader() }
    );
    console.log("✅ [toggleSaleOrderStatus] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ [toggleSaleOrderStatus] Lỗi khi cập nhật trạng thái:", error);
    throw error;
  }
};



export const getProducts = async () => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/user/products/active`,
      {
        headers: authHeader(),
        params: {
          page: 0,
          size: 1000, // Lấy đủ sản phẩm, điều chỉnh nếu cần
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm active:", error);
    throw error;
  }
};

export const updateOrder = async (orderId, orderData) => {
  try {
    const response = await axios.put(
      `${API_URL}/${orderId}`,
      orderData,
      { headers: authHeader() }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật đơn hàng:", error);
    throw error;
  }

};

export const getTotalQuantityOfProduct = async (productId) => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/user/inventory/product/${productId}/warehouses`,
      {
        headers: authHeader(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("❌ [getTotalQuantityOfProduct] Lỗi khi lấy tổng tồn kho:", error);
    throw error;
  }
};

export const getProductMaterialsByProduct = async (productId) => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/user/products/product-materials/${productId}?page=0&size=100`,
      { headers: authHeader() }
    );
    // Giả định BE trả về dữ liệu ở response.data.content
    return response.data.content;
  } catch (error) {
    console.error("Error fetching product materials for product", productId, error);
    throw error;
  }
};

export const cancelSaleOrder = async (orderId, reason) => {
  try {
    const response = await axios.put(
      `${API_URL}/${orderId}/cancel`,
      { rejectionReason: reason },
      {
        headers: authHeader()
      }
    );
    return response.data;
  } catch (error) {
    console.error("❌ [cancelSaleOrder] Lỗi:", error);
    throw error;
  }
};

export async function setPreparingStatus(payload) {
  const { saleOrderId, ...rest } = payload;
  try {
    const response = await axios.put(
      `${API_URL}/${saleOrderId}/set-preparing`,
      rest,
      { headers: authHeader() }
    );
    return response.data;
  } catch (error) {
    console.error("❌ [setPreparingStatus] Lỗi khi chuyển trạng thái đơn hàng:", error);
    throw error;
  }
}




