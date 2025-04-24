package vn.unistock.unistockmanagementsystem.features.user.warehouse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.unistock.unistockmanagementsystem.entities.Warehouse;
import vn.unistock.unistockmanagementsystem.features.admin.role.RoleDTO;
import vn.unistock.unistockmanagementsystem.features.user.products.ProductsDTO;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/unistock/user/warehouses")
@RequiredArgsConstructor
public class WarehouseController {
    @Autowired
    private final WarehouseService warehouseService;

    @PostMapping
    public ResponseEntity<?> addWarehouse(@Valid @RequestBody WarehouseDTO warehouseDTO){
        try {
            return ResponseEntity.ok(warehouseService.addWarehouse(warehouseDTO));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @GetMapping("/list")
    public ResponseEntity<List<Warehouse>> getAllActiveWarehouses(){
        List<Warehouse> warehouses = warehouseService.getAllActiveWarehouses();
        return ResponseEntity.ok(warehouses);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getWarehouses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive
    ) {
        Page<Warehouse> warehousePage = warehouseService.searchWarehouses(search, isActive, page, size);

        Map<String, Object> response = new HashMap<>();
        response.put("content", warehousePage.getContent());
        response.put("totalPages", warehousePage.getTotalPages());
        response.put("totalElements", warehousePage.getTotalElements());

        return ResponseEntity.ok(response);
    }



    @GetMapping("/{warehouseId}")
    public ResponseEntity<Warehouse> getWarehouseById(@PathVariable Long warehouseId){
        Warehouse warehouse = warehouseService.getWarehouseById(warehouseId);
        return ResponseEntity.ok(warehouse);
    }

    @PatchMapping("/{warehouseId}")
    public ResponseEntity<?> updateWarehouse(@Valid @PathVariable Long warehouseId, @RequestBody WarehouseDTO warehouseDTO){
        try {
            return ResponseEntity.ok(warehouseService.updateWarehouse(warehouseId, warehouseDTO));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @PatchMapping("/{warehouseId}/status")
    public ResponseEntity<Warehouse> updateWarehouseStatus(@PathVariable Long warehouseId, @RequestBody Map<String, Boolean> status){
        Warehouse updatedWarehouse = warehouseService.updateWarehouseStatus(warehouseId, status.get("isActive"));
        return ResponseEntity.ok(updatedWarehouse);
    }

    @GetMapping("/used-categories")
    public ResponseEntity<List<String>> getUsedWarehouseCategories(
            @RequestParam(required = false) Long excludeWarehouseId) {
        List<String> usedCategories = warehouseService.getUsedWarehouseCategories(excludeWarehouseId);
        return ResponseEntity.ok(usedCategories);
    }

    @GetMapping("/check-warehouse-code/{warehouseCode}")
    public ResponseEntity<Map<String, Boolean>> checkWarehouseCode(
            @PathVariable String warehouseCode,
            @RequestParam(required = false) Long excludeId
    ) {
        boolean exists = warehouseService.isWarehouseCodeExists(warehouseCode, excludeId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("exists", exists);
        return ResponseEntity.ok(response);
    }

}
