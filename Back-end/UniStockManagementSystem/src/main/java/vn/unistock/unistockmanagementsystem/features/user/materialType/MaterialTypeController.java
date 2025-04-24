package vn.unistock.unistockmanagementsystem.features.user.materialType;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/unistock/user/material-types")
@RequiredArgsConstructor
public class MaterialTypeController {
    private final MaterialTypeService materialTypeService;

    @GetMapping
    public ResponseEntity<Page<MaterialTypeDTO>> getAllMaterialTypes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(materialTypeService.getAllMaterialTypes(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaterialTypeDTO> getMaterialTypeById(@PathVariable Long id) {
        return ResponseEntity.ok(materialTypeService.getMaterialTypeById(id));
    }

    @PostMapping
    public ResponseEntity<MaterialTypeDTO> createMaterialType(@RequestBody MaterialTypeDTO materialTypeDTO) {
        return ResponseEntity.ok(materialTypeService.createMaterialType(materialTypeDTO, "Admin"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MaterialTypeDTO> updateMaterialType(
            @PathVariable Long id,
            @RequestBody MaterialTypeDTO materialTypeDTO
    ) {
        return ResponseEntity.ok(materialTypeService.updateMaterialType(id, materialTypeDTO));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<MaterialTypeDTO> toggleStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> statusRequest
    ) {
        Boolean newStatus = statusRequest.get("status");
        return ResponseEntity.ok(materialTypeService.toggleStatus(id, newStatus));
    }

    @GetMapping("/active")
    public ResponseEntity<List<MaterialTypeDTO>> getActiveMaterialTypes() {
        return ResponseEntity.ok(materialTypeService.getActiveMaterialTypes());
    }
}
