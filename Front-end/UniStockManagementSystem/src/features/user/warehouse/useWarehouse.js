import { useState, useEffect } from "react";
import { fetchWarehouses, updateWarehouseStatus, createWarehouse, updateWarehouse, fetchUsedWarehouseCategories, checkWarehouseCode } from "./warehouseService";
console.log("createWarehouse:", createWarehouse); 

const useWarehouse = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(1); 
  const [pageSize, setPageSize] = useState(10);

  const fetchPaginatedWarehouses = async (page = 1, size = pageSize, search = "", isActive = null) => {
    try {
      const apiPage = Math.max(page - 1, 0);
      const response = await fetchWarehouses(apiPage, size, search, isActive);
      setWarehouses(response.data || []);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setCurrentPage(page);
      setPageSize(size);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const fetchListWarehouses = async () => {
    try {
      const response = await getWarehouseList();
      console.log("Fetched warehouses:", response.data); // Log fetched warehouses
      setWarehouses(response.data || []); // Ensure warehouses is always an array
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };
  
  const toggleStatus = async (warehouseId, isActive) => {
    try {
      const newStatus = !isActive; 
      console.log(`Updating warehouse ${warehouseId}, new status: ${newStatus}`);
      await updateWarehouseStatus(warehouseId, newStatus);
      await fetchPaginatedWarehouses(currentPage, pageSize);
    } catch (error) {
      alert(error?.response?.data?.message || "Lỗi khi cập nhật trạng thái kho");
      console.error("Error updating warehouse status:", error);
    }    
};

  const editWarehouse = async (warehouseId, updatedWarehouse) => {
    try {
      console.log(`Updating warehouse ${warehouseId}:`, updatedWarehouse);
      const response = await updateWarehouse(warehouseId, updatedWarehouse);
      fetchPaginatedWarehouses();
      return response;
    } catch (error) {
      console.error("Error updating warehouse:", error);
      throw error;
    }
  };

  const addWarehouse = async (warehouse) => {
    try {
      const response = await createWarehouse(warehouse);
      fetchPaginatedWarehouses();
      return response;
    } catch (error) {
      console.error("Error creating warehouse:", error);
      throw error;
    }
  };

  const getUsedCategories = async (excludeWarehouseId = null) => {
    try {
      return await fetchUsedWarehouseCategories(excludeWarehouseId);
    } catch (error) {
      console.error("Error fetching used categories:", error);
      return [];
    }
  };  

  const isWarehouseCodeTaken = async (code, excludeId = null) => {
    return await checkWarehouseCode(code, excludeId);
  };

  return {
    warehouses,
    fetchPaginatedWarehouses,
    toggleStatus,
    totalPages,
    totalElements,
    addWarehouse,
    editWarehouse,
    fetchListWarehouses,
    getUsedCategories,
    isWarehouseCodeTaken
  };
};

export default useWarehouse;