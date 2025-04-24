import { useState, useEffect } from "react";
import {
  fetchPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrderById,
  getSaleOrderByPurchaseOrderId,
  createPurchaseOrdersFromRequest,
  fetchPendingOrInProgressOrders,
} from "./purchaseOrderService";

const usePurchaseOrder = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Lấy danh sách đơn hàng từ API
  const fetchPaginatedOrders = async (page = currentPage, size = pageSize, search = searchKeyword, status = selectedStatus) => {
    try {
      const response = await fetchPurchaseOrders(page, size, search, status);
      setPurchaseOrders(response.data || []);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setCurrentPage(page);
      setPageSize(size);
    } catch (error) {
      console.error("Lỗi khi tải danh sách đơn hàng:", error);
    }
  };

  const fetchOrderDetail = async () => {
    try {
      console.log("📢 Gọi API lấy đơn hàng với ID:", orderId);
      const response = await getPurchaseOrderById(orderId);
      console.log("✅ Kết quả từ API:", response);

      // Cập nhật state với items luôn có giá trị (không undefined)
      setOrder({ ...response, items: response.items || [] });
    } catch (error) {
      console.error("❌ Lỗi khi lấy chi tiết đơn hàng:", error);
      setError("Không thể tải dữ liệu đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  //tạo đơn mua hàng từ yêu cầu mua
  const createOrdersFromRequest = async (requestData) => {
    try {
      return await createPurchaseOrdersFromRequest(requestData);
    } catch (error) {
      throw error;
    }
  };


  useEffect(() => {
    fetchPaginatedOrders();
  }, [currentPage, pageSize, searchKeyword, selectedStatus]);

  return {
    purchaseOrders,
    fetchPaginatedOrders,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    updatePurchaseOrder,
    deletePurchaseOrder,
    fetchOrderDetail,
    totalPages,
    totalElements,
    currentPage,
    pageSize,
    searchKeyword,
    setSearchKeyword,
    selectedStatus,
    setSelectedStatus,
    getPurchaseOrderById,
    getSaleOrderByPurchaseOrderId,
    createOrdersFromRequest,
    fetchPendingOrInProgressOrders,
  };
};

export default usePurchaseOrder;
