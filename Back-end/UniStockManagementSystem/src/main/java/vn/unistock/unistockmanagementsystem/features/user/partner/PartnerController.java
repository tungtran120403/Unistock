package vn.unistock.unistockmanagementsystem.features.user.partner;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.unistock.unistockmanagementsystem.features.user.partnerType.PartnerTypeDTO;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/unistock/user/partner")
public class PartnerController {
    @Autowired
    private PartnerService partnerService;

    @GetMapping("/list")
    public ResponseEntity<Page<PartnerDTO>> getAllPartners(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(partnerService.getAllPartners(page, size));
    }

    @GetMapping("/list/type={typeId}")
    public ResponseEntity<Page<PartnerDTO>> getPartnersByType(
            @PathVariable Long typeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
        ) {
        return ResponseEntity.ok(partnerService.getPartnersByType(typeId, page, size));
    }

    @PostMapping("/add")
    public ResponseEntity<?> createPartner(@Valid @RequestBody PartnerDTO partnerDTO) {
        try {
            return ResponseEntity.ok(partnerService.createPartner(partnerDTO));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updatePartner(@RequestBody PartnerDTO partnerDTO) {
        try {
            return ResponseEntity.ok(partnerService.updatePartner(partnerDTO));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @GetMapping("/by-material/{materialId}")
    public ResponseEntity<List<PartnerDTO>> getPartnersByMaterial(@PathVariable Long materialId) {
        List<PartnerDTO> partners = partnerService.getPartnersByMaterial(materialId);
        return ResponseEntity.ok(partners);
    }

    @GetMapping("/code-prefix")
    public ResponseEntity<List<PartnerDTO>> getPartnersByCodePrefix(
            @RequestParam(defaultValue = "KH") String prefix
    ) {
        List<PartnerDTO> partners = partnerService.getPartnersByCodePrefix(prefix);
        return ResponseEntity.ok(partners);
    }

}
