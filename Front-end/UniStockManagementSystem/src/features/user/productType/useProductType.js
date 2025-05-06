import { useState, useCallback } from "react";
import { fetchProductTypes as fetchProductTypesService, toggleStatus as toggleStatusService, createProductType as createProductTypeService, updateProductType as updateProductTypeService } from "./productTypeService";

const useProductType = () => {
    const [productTypes, setProductTypes] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    const [filterState, setFilterState] = useState({
        search: undefined,
        statuses: undefined,
    }); 
    
    const fetchProductTypes = useCallback(async (page = 0, size = 10, filters = filterState, showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const data = await fetchProductTypesService({
                page,
                size,
                search: filters?.search,
                statuses: filters?.statuses,
            });
    
            // Xử lý data như cũ
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
            if (showLoading) setLoading(false);
        }
    }, []);
    
    const applyFilters = useCallback((filters, page = 0, size = 10, showLoading = false) => {
        setFilterState(prevState => ({
            ...prevState,
            ...filters
        }));
        fetchProductTypes(page, size, filters, showLoading);
    }, [fetchProductTypes]);    
    
    // const fetchProductTypes = useCallback(async (page = 0, size = 10, filters = filterState) => {
    //     try {
    //         setLoading(true);
            
    //         // Đảm bảo filters luôn có giá trị hợp lệ
    //         const currentFilters = filters || filterState;
            
    //         const data = await fetchProductTypesService({
    //             page,
    //             size,
    //             search: currentFilters?.search,
    //             statuses: currentFilters?.statuses,
    //         });
            
    //         // Xử lý dữ liệu trả về...
    //     } catch (error) {
    //         // Xử lý lỗi...
    //     } finally {
    //         setLoading(false);
    //     }
    // }, [filterState]);

    const toggleStatus = async (typeId, currentStatus, page = 0, size = 10) => {
        try {
            setLoading(true);
            const newStatus = !currentStatus;
            await toggleStatusService(typeId, newStatus);
            await fetchProductTypes(page, size, filterState);
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
        applyFilters,
    };
};

export default useProductType;