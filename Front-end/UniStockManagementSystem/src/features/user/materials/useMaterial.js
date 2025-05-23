import { useState, useEffect } from "react";
import { getAllMaterials } from "./materialService";
import axios from "axios";

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const useMaterial = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchPaginatedMaterials = async (page = currentPage, size = pageSize, filters = {}, showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      console.log("Fetching materials with page:", page, "size:", size);
      const response = await getAllMaterials(page, size, filters);

      console.log("API Response:", response);

      setMaterials(response.materials || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
      return response;
    } catch (error) {
      console.error("❌ Lỗi khi lấy danh sách nguyên vật liệu:", error);
      setMaterials([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleToggleStatus = async (materialId) => {
    if (!materialId) {
      console.log("❌ Lỗi: Không tìm thấy ID nguyên vật liệu!");
      return;
    }

    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/user/materials/${materialId}/toggle-using`,
        {},
        { headers: authHeader() }
      );

      console.log("✅ [handleToggleStatus] API Response:", response.data);

      setMaterials((prevMaterials) =>
        prevMaterials.map((mat) =>
          mat.materialId === materialId ? { ...mat, isUsing: response.data.isUsing } : mat
        )
      );

    } catch (error) {
      console.error("❌ Lỗi khi thay đổi trạng thái:", error);
      console.log("Lỗi khi thay đổi trạng thái nguyên vật liệu!");
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchPaginatedMaterials(page, pageSize);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(0);
    fetchPaginatedMaterials(0, size);
  };

  useEffect(() => {
    fetchPaginatedMaterials();
  }, []);

  return {
    materials,
    loading,
    currentPage,
    pageSize,
    totalPages,
    totalElements,
    fetchPaginatedMaterials,
    handleToggleStatus,
    handlePageChange,
    handlePageSizeChange
  };
};

export default useMaterial;