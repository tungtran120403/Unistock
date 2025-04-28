package vn.unistock.unistockmanagementsystem.features.user.productTypes;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/unistock/user/product-types")
@RequiredArgsConstructor
public class ProductTypeController {
    private final ProductTypeService productTypeService;

    @GetMapping
    public ResponseEntity<Page<ProductTypeDTO>> getAllProductTypes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ProductTypeDTO> productTypes = productTypeService.getAllProductTypes(pageable);
        return ResponseEntity.ok(productTypes);
    }

    @PatchMapping("/{typeId}/toggle-status")
    public ResponseEntity<ProductTypeDTO> toggleStatusProductType(
            @PathVariable Long typeId,
            @RequestBody Map<String, Boolean> statusRequest
    ) {
        Boolean newStatus = statusRequest.get("status");
        return ResponseEntity.ok(productTypeService.toggleStatus(typeId, newStatus));
    }

    @PostMapping
    public ResponseEntity<ProductTypeDTO> createProductType(@RequestBody ProductTypeDTO productTypeDTO) {
        ProductTypeDTO createdProductType = productTypeService.createProductType(productTypeDTO);
        return ResponseEntity.ok(createdProductType);
    }

    @PutMapping("/{typeId}")
    public ResponseEntity<ProductTypeDTO> updateProductType(
            @PathVariable Long typeId,
            @RequestBody ProductTypeDTO productTypeDTO
    ) {
        ProductTypeDTO updatedProductType = productTypeService.updateProductType(typeId, productTypeDTO);
        return ResponseEntity.ok(updatedProductType);
    }

    @GetMapping("/active")
    public ResponseEntity<List<ProductTypeDTO>> getActiveProductTypes() {
        return ResponseEntity.ok(productTypeService.getActiveProductTypes());
    }

    @GetMapping("/check-type-name/{typeName}")
    public ResponseEntity<Map<String, Boolean>> checkTypeName(
            @PathVariable String typeName,
            @RequestParam(required = false) Long excludeId
    ) {
        boolean exists = productTypeService.isTypeNameExists(typeName, excludeId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("exists", exists);
        return ResponseEntity.ok(response);
    }
}