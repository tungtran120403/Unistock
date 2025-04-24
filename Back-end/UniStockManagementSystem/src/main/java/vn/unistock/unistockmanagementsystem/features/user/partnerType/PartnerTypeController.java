package vn.unistock.unistockmanagementsystem.features.user.partnerType;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.unistock.unistockmanagementsystem.features.admin.user.UserDTO;
import vn.unistock.unistockmanagementsystem.features.user.productTypes.ProductTypeDTO;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/unistock/user/partner/type")
@RequiredArgsConstructor
public class PartnerTypeController {
    private final PartnerTypeService partnerTypeService;

    // API: Lấy danh sách loại đối tác
    @GetMapping
    public ResponseEntity<Page<PartnerTypeDTO>> getAllPartnerTypes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PartnerTypeDTO> partnerTypes = partnerTypeService.getAllPartnerTypes(pageable);
        return ResponseEntity.ok(partnerTypes);
    }

    // API: Tạo mới loại đối tác
    @PostMapping("/add")
    public ResponseEntity<?> createPartnerType(@RequestBody PartnerTypeDTO partnerTypeDTO) {
        try {
            return ResponseEntity.ok(partnerTypeService.addPartnerType(partnerTypeDTO));
        } catch (IllegalArgumentException e) {
            String errorCode = e.getMessage();
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorCode);
        }
    }

    // API: Update thông tin loại đối tác
    @PutMapping("/edit/{id}")
    public ResponseEntity<?> updatePartnerType(@PathVariable Long id, @RequestBody PartnerTypeDTO partnerTypeDTO) {
        try {
            return ResponseEntity.ok(partnerTypeService.updatePartnerType(id, partnerTypeDTO));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    // API: Update trang thái loại đối tác
    @PatchMapping("/{id}/status")
    public ResponseEntity<PartnerTypeDTO> updatedPartnerTypeStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> status) {
        PartnerTypeDTO updatedPartnerType = partnerTypeService.updatePartnerTypeStatus(id, status.get("status"));
        return ResponseEntity.ok(updatedPartnerType);
    }
}