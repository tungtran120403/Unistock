import { useState, useCallback } from "react";
import {
    fetchMaterialTypes as fetchMaterialTypesService,
    toggleStatus as toggleStatusService,
    createMaterialType as createMaterialTypeService,
    updateMaterialType as updateMaterialTypeService,
} from "./materialTypeService";

const useMaterialType = () => {
    const [materialTypes, setMaterialTypes] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchMaterialTypes = useCallback(async (page = 0, size = 10) => {
        try {
            setLoading(true);
            const data = await fetchMaterialTypesService(page, size);

            if (Array.isArray(data)) {
                setMaterialTypes(data);
                setTotalPages(1);
                setTotalElements(data.length);
            } else if (data && data.content) {
                setMaterialTypes(data.content);
                setTotalPages(data.totalPages || 1);
                setTotalElements(data.totalElements || data.content.length);
            } else {
                setMaterialTypes([]);
                setTotalPages(1);
                setTotalElements(0);
                console.warn("⚠️ API không trả về dữ liệu hợp lệ!");
            }
        } catch (error) {
            setMaterialTypes([]);
            setTotalPages(1);
            setTotalElements(0);
            console.error("❌ Lỗi khi lấy danh sách loại nguyên liệu:", error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleStatus = async (materialTypeId, currentStatus) => {
        try {
            setLoading(true);
            const newStatus = !currentStatus;
            await toggleStatusService(materialTypeId, newStatus);
            await fetchMaterialTypes(); // Làm mới danh sách sau khi thay đổi trạng thái
        } catch (error) {
            console.error("❌ Lỗi khi thay đổi trạng thái:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const createMaterialType = async (materialTypeData) => {
        try {
            setLoading(true);
            await createMaterialTypeService(materialTypeData);
            await fetchMaterialTypes(); // Làm mới danh sách sau khi tạo thành công
        } catch (error) {
            console.error("❌ Lỗi khi tạo loại nguyên liệu:", error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateMaterialType = async (materialTypeId, materialTypeData) => {
        try {
            setLoading(true);
            await updateMaterialTypeService(materialTypeId, materialTypeData);
            await fetchMaterialTypes(); // Làm mới danh sách sau khi cập nhật thành công
        } catch (error) {
            console.error("❌ Lỗi khi cập nhật loại nguyên liệu:", error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        materialTypes,
        fetchMaterialTypes,
        toggleStatus,
        createMaterialType,
        updateMaterialType,
        totalPages,
        totalElements,
        loading,
    };
};

export default useMaterialType;