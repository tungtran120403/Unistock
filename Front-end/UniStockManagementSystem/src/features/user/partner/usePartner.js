import { useState, useEffect } from "react";
import { getAllPartners, getPartnersByType } from "./partnerService";

const usePartner = () => {
  const [partners, setPartners] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaginatedPartners();
  }, [selectedType]);

  const fetchPaginatedPartners = async (page = currentPage, size = pageSize) => {
    setLoading(true);
    try {

      let data = null; 
      
      if (selectedType === null) {
        data = await getAllPartners(page, size);
      } else {
        data = await getPartnersByType(selectedType, page, size);
      }

      setPartners(data.partners || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      return data;
    } catch (error) {
      console.error("Lỗi khi tải đối tác:", error);
      setPartners([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false)
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchPaginatedPartners(page, pageSize);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(0);
    fetchPaginatedPartners(0, size);
  };

  const handleSelectType = (typeId) => {
    setSelectedType(typeId);
    setCurrentPage(0); // Reset về trang đầu khi lọc
  };

  return { 
    partners, 
    currentPage,
    pageSize,
    selectedType,
    totalPages,
    totalElements,
    loading,
    fetchPaginatedPartners,
    handlePageChange,
    handleSelectType,
    handlePageSizeChange,};
};

export default usePartner; // ✅ Đảm bảo export default
