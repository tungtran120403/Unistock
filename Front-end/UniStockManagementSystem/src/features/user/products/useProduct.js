import { useState, useEffect } from "react";
import { getAllProducts } from "./productService";
import axios from "axios";

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const useProduct = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchPaginatedProducts = async (page = currentPage, size = pageSize) => {
    try {
      setLoading(true);
      const response = await getAllProducts(page, size);

      setProducts(response.products || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
      return response;
    } catch (error) {
      console.error("❌ Lỗi khi lấy danh sách sản phẩm:", error);
      setProducts([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (productId) => {
    if (!productId) {
      console.error("❌ Lỗi: Không tìm thấy ID sản phẩm!");
      alert("Lỗi: Không tìm thấy ID sản phẩm!");
      return;
    }
  
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/user/products/${productId}/toggle-production`,
        {},
        { headers: authHeader() } // ⚠️ Đảm bảo token được gửi trong request
      );
  
      console.log("✅ [handleToggleStatus] API Response:", response.data);
      fetchPaginatedProducts(); // Refresh danh sách sản phẩm
    } catch (error) {
      console.error("❌ Lỗi khi thay đổi trạng thái sản phẩm:", error);
      alert(error.response?.data?.message || "Bạn không có quyền thay đổi trạng thái sản phẩm!");
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchPaginatedProducts(page, pageSize);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(0);
    fetchPaginatedProducts(0, size);
  };

  // Load dữ liệu ban đầu
  useEffect(() => {
    fetchPaginatedProducts();
  }, []);

  return {
    products,
    loading,
    currentPage,
    pageSize,
    totalPages,
    totalElements,
    fetchPaginatedProducts,
    handleToggleStatus,
    handlePageChange,
    handlePageSizeChange
  };
};

export default useProduct;