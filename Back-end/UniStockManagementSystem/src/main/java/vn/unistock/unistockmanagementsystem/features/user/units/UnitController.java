package vn.unistock.unistockmanagementsystem.features.user.units;

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
@RequestMapping("/api/unistock/user/units")
@RequiredArgsConstructor
public class UnitController {
    private final UnitService unitService;

    @GetMapping
    public ResponseEntity<Page<UnitDTO>> getAllUnits(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UnitDTO> units = unitService.getAllUnits(pageable);
        return ResponseEntity.ok(units);
    }

    @PatchMapping("/{unitId}/toggle-status")
    public ResponseEntity<UnitDTO> toggleStatus(
            @PathVariable Long unitId,
            @RequestBody Map<String, Boolean> statusRequest
    ) {
        Boolean newStatus = statusRequest.get("status");
        return ResponseEntity.ok(unitService.toggleStatus(unitId, newStatus));
    }

    @PostMapping
    public ResponseEntity<UnitDTO> createUnit(@RequestBody UnitDTO unitDTO) {
        UnitDTO createdUnit = unitService.createUnit(unitDTO);
        return ResponseEntity.ok(createdUnit);
    }

    @GetMapping("/active")
    public ResponseEntity<List<UnitDTO>> getActiveUnits() {
        return ResponseEntity.ok(unitService.getActiveUnits());
    }

    @PutMapping("/{unitId}")
    public ResponseEntity<UnitDTO> updateUnit(
            @PathVariable Long unitId,
            @RequestBody UnitDTO unitDTO
    ) {
        UnitDTO updatedUnit = unitService.updateUnit(unitId, unitDTO);
        return ResponseEntity.ok(updatedUnit);
    }

    @GetMapping("/check-unit-name/{unitName}")
    public ResponseEntity<Map<String, Boolean>> checkUnitName(
            @PathVariable String unitName,
            @RequestParam(required = false) Long excludeId
    ) {
        boolean exists = unitService.isUnitNameExists(unitName, excludeId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("exists", exists);
        return ResponseEntity.ok(response);
    }
}