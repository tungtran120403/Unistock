//package vn.unistock.unistockmanagementsystem.features.user.productMaterials;
//
//import lombok.RequiredArgsConstructor;
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.PageRequest;
//import org.springframework.data.domain.Pageable;
//import org.springframework.http.HttpStatus;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//import vn.unistock.unistockmanagementsystem.features.user.products.ProductMaterialsDTO;
//
//@RestController
//@RequestMapping("/api/unistock/user/product-materials") // ✅ API dành riêng cho User
//@RequiredArgsConstructor
//public class ProductMaterialsController {
//    private final ProductMaterialsService productMaterialService;
//
//    // Show định mức với phân trang
//    @GetMapping("/{productId}")
//    public ResponseEntity<Page<ProductMaterialsDTO>> getMaterialsByProduct(
//            @PathVariable Long productId,
//            @RequestParam(defaultValue = "0") int page,
//            @RequestParam(defaultValue = "10") int size) {
//        try {
//            Pageable pageable = PageRequest.of(page, size);
//            Page<ProductMaterialsDTO> materialsPage = productMaterialService.getMaterialsByProduct(productId, pageable);
//            return ResponseEntity.ok(materialsPage);
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null); // Trả về null nếu không tìm thấy
//        }
//    }
//
////    // Lưu định mức
////    @PostMapping("/{productId}/materials")
////    public ResponseEntity<String> saveProductMaterials(
////            @PathVariable Long productId,
////            @RequestBody List<ProductMaterialsDTO> materialsDTOList) {
////        productMaterialService.saveProductMaterials(productId, materialsDTOList);
////        return ResponseEntity.ok("Định mức nguyên vật liệu đã được cập nhật!");
////    }
////
////    @DeleteMapping("/{productId}/materials/{materialId}")
////    public ResponseEntity<?> deleteMaterialFromProduct(@PathVariable Long productId, @PathVariable Long materialId) {
////        try {
////            productMaterialService.deleteProductMaterial(productId, materialId);
////            return ResponseEntity.ok("Xóa vật tư thành công!");
////        } catch (RuntimeException e) {
////            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
////        }
////    }
////
////    @GetMapping("/sale-order/{saleOrderId}")
////    public ResponseEntity<List<ProductMaterialsDTO>> getMaterialsBySaleOrder(@PathVariable Long saleOrderId) {
////        List<ProductMaterialsDTO> materials = productMaterialService.getMaterialsBySaleOrderId(saleOrderId);
////        return ResponseEntity.ok(materials);
////    }
//}