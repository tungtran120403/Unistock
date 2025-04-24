import { useState, useEffect, useCallback } from "react";
import {
  getPurchaseRequests,
  getNextRequestCode,
  createPurchaseRequest,
  updatePurchaseRequestStatus
} from "./PurchaseRequestService";

const usePurchaseRequest = () => {
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const fetchPurchaseRequests = async (page = 0, size = 10) => {
    try {
      const data = await getPurchaseRequests(page, size);
      setPurchaseRequests(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      console.error("❌ Error fetching purchase requests:", error);
      // Set empty state on error
      setPurchaseRequests([]);
      setTotalPages(1);
      setTotalElements(0);
    }
  };

  const getNextCode = async () => {
    try {
      const code = await getNextRequestCode();
      return code;
    } catch (error) {
      console.error("❌ Error getting next code:", error);
      throw error;
    }
  };

  const addRequest = useCallback(async (requestData) => {
    try {
      const result = await createPurchaseRequest(requestData);
      await fetchPurchaseRequests(); // Đảm bảo cập nhật danh sách
      return result;
    } catch (error) {
      console.error("Error adding request:", error);
      throw error;
    }
  }, []);

  const mapVietnameseToStatus = (vietnameseStatus) => {
    const statusMap = {
      "Chờ duyệt": "PENDING",
      "Đã duyệt": "CONFIRMED",
      "Từ chối": "CANCELLED",
    };
    return statusMap[vietnameseStatus] || vietnameseStatus;
  };

  const togglePurchaseRequestStatus = async (id, status) => {
    try {
      const apiStatus = mapVietnameseToStatus(status);
      await updatePurchaseRequestStatus(id, apiStatus);
      await fetchPurchaseRequests();
    } catch (error) {
      console.error("Error toggling status:", error);
      throw error;
    }
  };

  const getPurchaseRequestById = async (id) => {
    try {
      return await fetchRequestDetail(id);
    } catch (error) {
      console.error("❌ Lỗi getPurchaseRequestById trong hook:", error);
      throw error;
    }
  };

  useEffect(() => {
    fetchPurchaseRequests();
  }, []);

  return {
    purchaseRequests,
    totalPages,
    totalElements,
    fetchPurchaseRequests,
    getNextCode,
    addRequest,
    togglePurchaseRequestStatus,
  };
};

export default usePurchaseRequest;