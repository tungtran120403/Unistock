import { useState, useCallback } from "react";
import { fetchProductTypes as fetchProductTypesService, toggleStatus as toggleStatusService, createProductType as createProductTypeService, updateProductType as updateProductTypeService } from "./productTypeService";

const useProductType = () => {
    const [productTypes, setProductTypes] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchProductTypes = useCallback(async (page = 0, size = 10) => {
        try {
            setLoading(true);
            const data = await fetchProductTypesService(page, size);

            if (Array.isArray(data)) {
                setProductTypes(data);
                setTotalPages(1);
                setTotalElements(data.length);
            } else if (data && data.content) {
                setProductTypes(data.content);
                setTotalPages(data.totalPages || 1);
                setTotalElements(data.totalElements || data.content.length);
            } else {
                setProductTypes([]);
                setTotalPages(1);
                setTotalElements(0);
                console.warn("⚠️ API không trả về dữ liệu hợp lệ!");
            }
        } catch (error) {
            setProductTypes([]);
            setTotalPages(1);
            setTotalElements(0);
            console.error("❌ Lỗi khi lấy danh sách dòng sản phẩm:", error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleStatus = async (typeId, currentStatus) => {
        try {
            setLoading(true);
            const newStatus = !currentStatus;
            await toggleStatusService(typeId, newStatus);
            await fetchProductTypes(); // Làm mới danh sách sau khi thay đổi trạng thái
        } catch (error) {
            console.error("❌ Lỗi khi thay đổi trạng thái:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const createProductType = async (productTypeData) => {
        try {
            setLoading(true);
            await createProductTypeService(productTypeData);
            await fetchProductTypes(); // Làm mới danh sách sau khi tạo thành công
        } catch (error) {
            console.error("❌ Lỗi khi tạo dòng sản phẩm:", error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateProductType = async (typeId, productTypeData) => {
        try {
            setLoading(true);
            await updateProductTypeService(typeId, productTypeData);
            await fetchProductTypes();
        } catch (error) {
            console.error("❌ Lỗi khi cập nhật dòng sản phẩm:", error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        productTypes,
        fetchProductTypes,
        toggleStatus,
        createProductType,
        totalPages,
        updateProductType,
        totalElements,
        loading,
    };
};

export default useProductType;