//package vn.unistock.unistockmanagementsystem.features.user.materialPartners;
//
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//import vn.unistock.unistockmanagementsystem.entities.MaterialPartner;
//
//import java.util.List;
//import java.util.stream.Collectors;
//
//@RestController
//@RequestMapping("/api/unistock/user/material-partners")
//@RequiredArgsConstructor
//@Slf4j
//public class MaterialPartnerController {
//
//    private final MaterialPartnerService materialPartnerService;
//
//    @GetMapping("/{materialId}/suppliers")
//    public ResponseEntity<List<Long>> getSupplierIds(@PathVariable Long materialId) {
//        List<Long> supplierIds = materialPartnerService.getPartnerIdsByMaterial(materialId);
//        return ResponseEntity.ok(supplierIds);
//    }
//
//    @PostMapping("/{materialId}/add-suppliers")
//    public ResponseEntity<String> addSuppliers(
//            @PathVariable Long materialId,
//            @RequestBody List<Long> supplierIds) {
//
//        if (supplierIds == null || supplierIds.isEmpty()) {
//            return ResponseEntity.badRequest().body("Danh sách nhà cung cấp không được rỗng.");
//        }
//
//        materialsService.addPartnersToMaterial(materialId, supplierIds);
//        return ResponseEntity.ok("Đã thêm nhà cung cấp vào vật tư.");
//    }
//}
