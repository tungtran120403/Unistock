package vn.unistock.unistockmanagementsystem.features.user.inventory;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/unistock/user/inventory")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryService inventoryService;

    // GET /api/inventory/product/{productId}/total-quantity
    @GetMapping("/product/{productId}/total-quantity")
    public ResponseEntity<Double> getTotalQuantity(@PathVariable Long productId) {
        Double totalQty = inventoryService.getTotalQuantityOfProduct(productId);
        return ResponseEntity.ok(totalQty);
    }
    @GetMapping("/product/{productId}/warehouses")
    public ResponseEntity<List<InventoryByWarehouseDTO>> getInventoryDetailsByWarehouse(
            @PathVariable Long productId,
            @RequestParam(required = false) Long salesOrderId) {
        List<InventoryByWarehouseDTO> details = inventoryService.getInventoryDetailsByProduct(productId, salesOrderId);
        return ResponseEntity.ok(details);
    }

    @GetMapping("/material/{materialId}/total-quantity")
    public ResponseEntity<Double> getTotalQuantityM(@PathVariable Long materialId) {
        Double totalQty = inventoryService.getTotalQuantityOfMaterial(materialId);
        return ResponseEntity.ok(totalQty);
    }

    @GetMapping("/material/{materialId}/warehouses")
    public ResponseEntity<List<InventoryByWarehouseDTO>> getInventoryDetailsByWarehouseM(
            @PathVariable Long materialId,
            @RequestParam(required = false) Long salesOrderId) {
        List<InventoryByWarehouseDTO> details = inventoryService.getInventoryDetailsByMaterial(materialId, salesOrderId);
        return ResponseEntity.ok(details);
    }

    @GetMapping("/report")
    public ResponseEntity<Page<InventoryReportDTO>> getInventoryReport(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) List<Long> warehouseIds,
            @RequestParam(required = false) List<Boolean> statuses,
            @RequestParam(required = false) Double minAvailable,
            @RequestParam(required = false) Double maxAvailable,
            @RequestParam(required = false) Double minReserved,
            @RequestParam(required = false) Double maxReserved,
            @RequestParam(required = false) Double minTotal,
            @RequestParam(required = false) Double maxTotal,
            @RequestParam(required = false) String itemType,
            @RequestParam(required = false) List<Long> productTypeIds,
            @RequestParam(required = false) List<Long> materialTypeIds
    ) {
        return ResponseEntity.ok(
                inventoryService.getInventoryReport(
                        page, size, search, warehouseIds, statuses,
                        minAvailable, maxAvailable,
                        minReserved, maxReserved,
                        minTotal, maxTotal, itemType,
                        productTypeIds, materialTypeIds
                )
        );
    }

}
