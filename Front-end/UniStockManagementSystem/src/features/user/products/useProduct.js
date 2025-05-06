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
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [filterState, setFilterState] = useState({
    search: undefined,
    statuses: undefined,
    typeIds: undefined,
  });

  const fetchPaginatedProducts = async (page = currentPage, size = pageSize, filters = filterState, isFirstLoad) => {
    if (isFirstLoad) {
      setLoading(true);
    }
    try {
      const response = await getAllProducts({
        page,
        size,
        ...filters,
      });
      setProducts(response.products || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
      setCurrentPage(page);
      return response;
    } catch (error) {
      console.error("❌ Lỗi khi lấy danh sách sản phẩm:", error);
      setProducts([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      if (isFirstLoad) {
        setLoading(false);
      }
    }
  };

  // const applyFilters = (filters) => {
  //   setFilterState(filters);
  //   fetchPaginatedProducts(0, pageSize, filters, isFirstLoad);
  //   if (isFirstLoad) {
  //     setIsFirstLoad(false);  // ✅ Sau lần đầu, tắt flag này
  //   }
  // };

  const applyFilters = (filters, isFirstLoad = false) => {
    setFilterState(filters);
    fetchPaginatedProducts(0, pageSize, filters, isFirstLoad);
};


  const handleToggleStatus = async (productId) => {
    if (!productId) {
      console.error("❌ Lỗi: Không tìm thấy ID sản phẩm!");
      console.log("Lỗi: Không tìm thấy ID sản phẩm!");
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
      console.log(error.response?.data?.message || "Bạn không có quyền thay đổi trạng thái sản phẩm!");
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

  // // Load dữ liệu ban đầu
  // useEffect(() => {
  //   fetchPaginatedProducts();
  // }, []);

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
    handlePageSizeChange,
    applyFilters
  };
};

export default useProduct;