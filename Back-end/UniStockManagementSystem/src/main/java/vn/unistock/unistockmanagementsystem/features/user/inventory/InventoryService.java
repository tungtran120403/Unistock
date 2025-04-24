package vn.unistock.unistockmanagementsystem.features.user.inventory;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import vn.unistock.unistockmanagementsystem.entities.User;
import vn.unistock.unistockmanagementsystem.features.admin.user.UserDTO;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {
    private final InventoryRepository inventoryRepository;

    public List<InventoryByWarehouseDTO> findInventoryByAll(Long productId, Long materialId) {
        return inventoryRepository.findInventoryByAll(productId, materialId);
    }

    public Double getTotalQuantityOfProduct(Long productId) {
        return inventoryRepository.getTotalQuantityByProductId(productId);
    }

    public Double getTotalQuantityOfMaterial(Long materialId) {
        return inventoryRepository.getTotalQuantityByMaterialId(materialId);
    }

    public List<InventoryByWarehouseDTO> getInventoryDetailsByProduct(Long productId, Long salesOrderId) {
        if (salesOrderId != null) {
            return inventoryRepository.findInventoryByProductIdWithSalesOrder(productId, salesOrderId);
        }
        return inventoryRepository.findInventoryByProductId(productId);
    }

    public List<InventoryByWarehouseDTO> getInventoryDetailsByMaterial(Long materialId, Long salesOrderId) {
        if (salesOrderId != null) {
            return inventoryRepository.findInventoryByMaterialIdWithSalesOrder(materialId, salesOrderId);
        }
        return inventoryRepository.findInventoryByMaterialId(materialId);
    }


    public Page<InventoryReportDTO> getInventoryReport(
            int page,
            int size,
            String search,
            List<Long> warehouseIds,
            List<Boolean> statuses,
            Double minAvailable,
            Double maxAvailable,
            Double minReserved,
            Double maxReserved,
            Double minTotal,
            Double maxTotal,
            String itemType,
            List<Long> productTypeIds,
            List<Long> materialTypeIds
    ) {
        Pageable pageable = PageRequest.of(page, size);
        List<InventoryReportDTO> all = inventoryRepository.getInventoryReportRaw();

        List<InventoryReportDTO> filtered = all.stream()
                .filter(dto -> search == null || dto.getItemCode().toLowerCase().contains(search.toLowerCase())
                        || dto.getItemName().toLowerCase().contains(search.toLowerCase()))
                .filter(dto -> warehouseIds == null || warehouseIds.isEmpty() || warehouseIds.contains(dto.getWarehouseId()))
                .filter(dto -> statuses == null || statuses.isEmpty() || statuses.contains(dto.getIsActive()))
                .filter(dto -> minAvailable == null || dto.getAvailableQuantity() >= minAvailable)
                .filter(dto -> maxAvailable == null || dto.getAvailableQuantity() <= maxAvailable)
                .filter(dto -> minReserved == null || dto.getReservedQuantity() >= minReserved)
                .filter(dto -> maxReserved == null || dto.getReservedQuantity() <= maxReserved)
                .filter(dto -> minTotal == null || dto.getTotalQuantity() >= minTotal)
                .filter(dto -> maxTotal == null || dto.getTotalQuantity() <= maxTotal)
                .filter(dto -> itemType == null || itemType.isEmpty() || itemType.equalsIgnoreCase(dto.getItemType()))
                // Ép buộc lọc theo itemType nếu có truyền vào
                .filter(dto -> {
                    if (itemType != null && !itemType.isEmpty()) {
                        return itemType.equalsIgnoreCase(dto.getItemType());
                    }
                    return true;
                })
                .filter(dto -> {
                    if ("PRODUCT".equalsIgnoreCase(dto.getItemType())) {
                        return productTypeIds == null || productTypeIds.isEmpty() || productTypeIds.contains(dto.getProductTypeId());
                    }
                    return true;
                })
                .filter(dto -> {
                    if ("MATERIAL".equalsIgnoreCase(dto.getItemType())) {
                        return materialTypeIds == null || materialTypeIds.isEmpty() || materialTypeIds.contains(dto.getMaterialTypeId());
                    }
                    return true;
                })
                .toList();

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        return new PageImpl<>(filtered.subList(start, end), pageable, filtered.size());
    }

}
