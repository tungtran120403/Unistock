import axios from "axios";

// API endpoint for purchase orders
const API_URL = `${import.meta.env.VITE_API_URL}/user/purchases`;

// Lấy token từ localStorage
const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {}; 
};

// Lấy danh sách đơn hàng có phân trang, tìm kiếm và lọc trạng thái
export const fetchPurchaseOrders = async (page, size, searchKeyword = '', status = '', startDate = null, endDate = null) => {
  const queryParams = new URLSearchParams({ page, size });
  if (searchKeyword) queryParams.append("search", searchKeyword);
  if (status) queryParams.append("status", status);
  if (startDate) queryParams.append("startDate", startDate.toISOString());
  if (endDate) queryParams.append("endDate", endDate.toISOString());

  const response = await axios.get(`${API_URL}?${queryParams.toString()}`, { headers: authHeader() });
  return {
      data: response.data.content,
      totalPages: response.data.totalPages,
      totalElements: response.data.totalElements,
  };
};

// Lấy chi tiết đơn hàng theo ID
export const getPurchaseOrderById = async (orderId) => {
  try {
    console.log(`📢 Gửi request GET: ${API_URL}/${orderId}`);
    const response = await axios.get(`${API_URL}/${orderId}`, { headers: authHeader() });

    // Đảm bảo items không bị undefined hoặc null
    return { ...response.data, items: response.data.items ? response.data.items : [] };
  } catch (error) {
    console.error("❌ API lỗi:", error.response ? error.response.data : error.message);
    throw error;
  }
};


// Tạo mới đơn hàng
export const createPurchaseOrder = async (orderData) => {
  try {
    const response = await axios.post(API_URL, orderData, { headers: authHeader() });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi tạo đơn hàng:", error);
    throw error;
  }
};

// Cập nhật trạng thái đơn hàng
export const updatePurchaseOrderStatus = async (orderId, newStatus) => {
  try {
    const response = await axios.patch(
      `${API_URL}/${orderId}/status`,
      { status: newStatus }, 
      { headers: authHeader() }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
    throw error;
  }
};

export const createPurchaseOrdersFromRequest = async (requestData) => {
  try {
    const response = await axios.post(`${API_URL}`, requestData, {
      headers: {
        ...authHeader(),
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi tạo đơn mua hàng từ yêu cầu:", error);
    throw error;
  }
};


// Cập nhật thông tin đơn hàng
export const updatePurchaseOrder = async (orderId, orderData) => {
  try {
    const response = await axios.patch(`${API_URL}/${orderId}`, orderData, { headers: authHeader() });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật đơn hàng:", error);
    throw error;
  }
};

// Xóa đơn hàng
export const deletePurchaseOrder = async (orderId) => {
  try {
    await axios.delete(`${API_URL}/${orderId}`, { headers: authHeader() });
    return true;
  } catch (error) {
    console.error("Lỗi khi xóa đơn hàng:", error);
    throw error;
  }
};

//tìm đơn đặt hàng (nếu có) từ mã đơn mua vật tư
export const getSaleOrderByPurchaseOrderId = async (poId) => {
  const response = await axios.get(`${API_URL}/${poId}/sale-order`, {
    headers: authHeader(),
  });
  return response.data;
};

// Lấy các đơn hàng có trạng thái PENDING hoặc IN_PROGRESS
export const fetchPendingOrInProgressOrders = async () => {
  try {
    const response = await axios.get(`${API_URL}/filter/status`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy đơn hàng chờ nhận hoặc đã nhập một phần:", error);
    throw error;
  }
};

export const getPurchaseRequestById = async (requestId) => {
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/purchase-requests/${requestId}`, {
    headers: authHeader(),
  });
  return response.data;
};

