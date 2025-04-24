import { useState, useCallback } from "react";
import { fetchUnits, toggleStatus, createUnit, updateUnit } from "./unitService";

const useUnit = () => {
    const [units, setUnits] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchUnitsCallback = useCallback(async (page = 0, size = 10) => {
        try {
            setLoading(true);
            const data = await fetchUnits(page, size);

            if (Array.isArray(data)) {
                setUnits(data);
                setTotalPages(1);
                setTotalElements(data.length);
            } else if (data && data.content) {
                setUnits(data.content);
                setTotalPages(data.totalPages || 1);
                setTotalElements(data.totalElements || data.content.length);
            } else {
                setUnits([]);
                setTotalPages(1);
                setTotalElements(0);
                console.warn("⚠️ API không trả về dữ liệu hợp lệ!");
            }
        } catch (error) {
            setUnits([]);
            setTotalPages(1);
            setTotalElements(0);
            console.error("❌ Lỗi khi lấy danh sách đơn vị tính:", error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleStatusCallback = async (unitId, currentStatus) => {
        try {
            setLoading(true);
            const newStatus = !currentStatus;
            await toggleStatus(unitId, newStatus);
            await fetchUnitsCallback();
        } catch (error) {
            console.error("❌ Lỗi khi thay đổi trạng thái:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const createUnitCallback = async (unitData) => {
        try {
            setLoading(true);
            await createUnit(unitData);
            await fetchUnitsCallback();
        } catch (error) {
            console.error("❌ Lỗi khi tạo đơn vị tính:", error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateUnitCallback = async (unitId, unitData) => {
        try {
            setLoading(true);
            await updateUnit(unitId, unitData);
            await fetchUnitsCallback();
        } catch (error) {
            console.error("❌ Lỗi khi cập nhật đơn vị tính:", error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        units,
        fetchUnits: fetchUnitsCallback,
        toggleStatus: toggleStatusCallback,
        createUnit: createUnitCallback,
        updateUnit: updateUnitCallback,
        totalPages,
        totalElements,
        loading,
    };
};

export default useUnit;