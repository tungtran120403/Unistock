import { useState, useEffect } from "react";
import { addSaleOrder, getNextOrderCode,  getSaleOrders, toggleSaleOrderStatus, updateOrder } from "./saleOrdersService";

const useSaleOrder = () => {
  const [saleOrders, setSaleOrders] = useState([]); // ✅ Danh sách đơn hàng
  const [totalPages, setTotalPages] = useState(1); // ✅ Tổng số trang
  const [totalElements, setTotalElements] = useState(0); // ✅ Tổng số đơn hàng
  const [loading, setLoading] = useState(false); // ✅ New loading state

  // State cho filter và search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Lấy danh sách Sale Orders có phân trang, filter và search
  const fetchPaginatedSaleOrders = async (page = 0, size = 10) => {
    setLoading(true);
    try {
      const data = await getSaleOrders(page, size, searchTerm, selectedStatuses, startDate, endDate);
      setSaleOrders(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      console.error("❌ Không thể tải danh sách Sale Orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 **Toggle trạng thái đơn hàng**
  const toggleStatus = async (orderId, currentStatus) => {
    try {
      const newStatus = currentStatus === "PENDING" ? "CONFIRMED" : "PENDING"; // ✅ Ví dụ đảo trạng thái
      const updatedOrder = await toggleSaleOrderStatus(orderId, newStatus);

      setSaleOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.orderId === orderId ? { ...order, status: updatedOrder.status } : order
        )
      );
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật trạng thái đơn hàng:", error);
    }
  };

  const getNextCode = async () => {
    try {
      const code = await getNextOrderCode();
      return code; // ví dụ "ĐH00003"
    } catch (error) {
      console.error("❌ Lỗi khi lấy mã đơn hàng tiếp theo:", error);
      throw error;
    }
  };

  // ✅ Gọi API ngay khi Component được mount
  useEffect(() => {
    fetchPaginatedSaleOrders();
  }, []);

  const addOrder = async (orderData) => {
    try {
      const data = await addSaleOrder(orderData);
      return data;
    } catch (error) {
      console.error("❌ Lỗi khi thêm đơn hàng:", error);
      throw error;
    }
  };

  const updateExistingOrder = async (orderId, orderData) => {
    try {
      const updated = await updateOrder(orderId, orderData);
      return updated; // Trả về data sau khi update
    } catch (err) {
      console.error("Lỗi khi cập nhật đơn hàng:", err);
      throw err;
    }
  };
  
  // Gọi lại API khi các tham số thay đổi
  useEffect(() => {
    fetchPaginatedSaleOrders(0);
  }, [searchTerm, selectedStatuses, startDate, endDate]);

  return { saleOrders,
    fetchPaginatedSaleOrders,
    toggleStatus,
    totalPages,
    totalElements,
    loading,
    getNextCode,
    addOrder,
    updateExistingOrder,
    searchTerm,
    setSearchTerm,
    selectedStatuses,
    setSelectedStatuses,
    startDate,
    setStartDate,
    endDate,
    setEndDate, };
};

export default useSaleOrder;
