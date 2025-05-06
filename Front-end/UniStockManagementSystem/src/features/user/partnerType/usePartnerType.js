import { useState, useCallback } from "react";
import { getPartnerTypes, togglePartnerTypeStatus } from "./partnerTypeService";

const usePartnerType = () => {
  const [partnerTypes, setPartnerTypes] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPartnerTypes = useCallback(async (page = 0, size = 10) => {
    setLoading(true)
    try {
      const data = await getPartnerTypes(page, size);

      if (Array.isArray(data)) {
        setPartnerTypes(data);
        setTotalPages(1);
        setTotalElements(data.length);
      } else if (data && data.content) {
        setPartnerTypes(data.content);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || data.content.length);
      } else {
        setPartnerTypes([]);
        setTotalPages(1);
        setTotalElements(0);
        console.warn("⚠️ API không trả về dữ liệu hợp lệ!");
      }
    } catch (error) {
      setPartnerTypes([]);
      setTotalPages(1);
      setTotalElements(0);
      console.error("❌ Failed to fetch partner types:", error.message);
    } finally {
      setLoading(false)
    }
  }, []);

  // 🔄 **Toggle trạng thái `isActive`**
  const toggleStatus = async (typeId, currentStatus) => {
    try {
      const newStatus = !currentStatus; // ✅ Đảo trạng thái hiện tại
      const updatedPartnerType = await togglePartnerTypeStatus(typeId, newStatus);
      setPartnerTypes((prevPartnerTypes) =>
        prevPartnerTypes.map((partnerType) =>
          partnerType.typeId === typeId
            ? { ...partnerType, status: updatedPartnerType.status }
            : partnerType
        )
      );
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật trạng thái:", error);
    }
  };



  return {
    partnerTypes,
    fetchPartnerTypes,
    toggleStatus,
    totalPages,
    totalElements,
    loading,
  };
};

export default usePartnerType;
