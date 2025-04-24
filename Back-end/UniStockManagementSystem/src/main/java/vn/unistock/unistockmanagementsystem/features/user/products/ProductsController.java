package vn.unistock.unistockmanagementsystem.features.user.products;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.unistock.unistockmanagementsystem.entities.Product;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/unistock/user/products")
@RequiredArgsConstructor
public class ProductsController {
    private final ProductsService productsService;
    private final ExcelService excelService;

    @GetMapping
        public ResponseEntity<Page<ProductsDTO>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(productsService.getAllProducts(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductsDTO> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productsService.getProductById(id));
    }

    @PostMapping(value = "/preview-import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<ProductPreviewDTO>> previewImportProducts(
            @RequestParam("file") MultipartFile file) {
        try {
            List<ProductPreviewDTO> previewList = excelService.previewImportProducts(file);
            return ResponseEntity.ok(previewList);
        } catch (Exception e) {
            log.error("❌ Lỗi khi preview import sản phẩm:", e);
            ProductPreviewDTO error = new ProductPreviewDTO();
            error.setValid(false);
            error.setErrorMessage("Lỗi khi kiểm tra file: " + e.getMessage());
            return ResponseEntity.badRequest().body(List.of(error));
        }
    }


    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> importProducts(@RequestParam("file") MultipartFile file) {
        try {
            List<ProductPreviewDTO> previewList = excelService.previewImportProducts(file);
            boolean hasErrors = previewList.stream().anyMatch(dto -> !dto.isValid());
            if (hasErrors) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("❌ File chứa dòng không hợp lệ, không thể import.");
            }

            String result = excelService.importProducts(file);
            return ResponseEntity.ok("✅ " + result);
        } catch (Exception e) {
            log.error("❌ Lỗi khi import sản phẩm:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("❌ Lỗi: " + e.getMessage());
        }
    }

    @PatchMapping("/{id}/toggle-production")
    public ResponseEntity<ProductsDTO> toggleProductionStatus(@PathVariable Long id) {
        return ResponseEntity.ok(productsService.toggleProductionStatus(id));
    }

    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createProduct(
            @RequestParam("productCode") String productCode,
            @RequestParam("productName") String productName,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "unitId", required = false) Long unitId,
            @RequestParam(value = "typeId", required = false) Long typeId,
            @RequestParam(value = "isProductionActive", required = false, defaultValue = "true") Boolean isProductionActive,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam("materials") String materialsJson) throws IOException {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            List<ProductMaterialsDTO> materials = objectMapper.readValue(materialsJson, new TypeReference<List<ProductMaterialsDTO>>() {});

            ProductsDTO dto = new ProductsDTO();
            dto.setProductCode(productCode);
            dto.setProductName(productName);
            dto.setDescription(description);
            dto.setUnitId(unitId);
            dto.setTypeId(typeId);
            dto.setIsProductionActive(isProductionActive);
            dto.setImage(image);
            dto.setMaterials(materials);

            Product createdProduct = productsService.createProduct(dto, "Admin");
            return ResponseEntity.ok(createdProduct);
        } catch (Exception e) {
            log.error("Lỗi khi tạo sản phẩm với định mức: ", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Lỗi khi tạo sản phẩm: " + e.getMessage());
        }
    }

    @GetMapping("/check-product-code/{productCode}")
    public ResponseEntity<Map<String, Boolean>> checkProductCode(
            @PathVariable String productCode,
            @RequestParam(required = false) Long excludeId
    ) {
        boolean exists = productsService.isProductCodeExists(productCode, excludeId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("exists", exists);
        return ResponseEntity.ok(response);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateProduct(
            @PathVariable Long id,
            @RequestParam("productCode") String productCode,
            @RequestParam("productName") String productName,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "unitId", required = false) Long unitId,
            @RequestParam(value = "typeId", required = false) Long typeId,
            @RequestParam(value = "isProductionActive", required = false, defaultValue = "true") Boolean isProductionActive,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "materials", required = false) String materialsJson) throws IOException {
        try {
            List<ProductMaterialsDTO> materials = null;
            if (materialsJson != null && !materialsJson.trim().isEmpty()) {
                ObjectMapper objectMapper = new ObjectMapper();
                materials = objectMapper.readValue(materialsJson, new TypeReference<List<ProductMaterialsDTO>>() {});
            }

            ProductsDTO dto = new ProductsDTO();
            dto.setProductCode(productCode);
            dto.setProductName(productName);
            dto.setDescription(description);
            dto.setUnitId(unitId);
            dto.setTypeId(typeId);
            dto.setIsProductionActive(isProductionActive);
            dto.setImage(image);
            dto.setMaterials(materials);

            ProductsDTO updatedProduct = productsService.updateProduct(id, dto, image);
            return ResponseEntity.ok(updatedProduct);
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật sản phẩm với định mức: ", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Lỗi khi cập nhật sản phẩm: " + e.getMessage());
        }
    }

    @GetMapping("/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        try {
            ByteArrayInputStream stream = excelService.generateProductImportTemplate();
            byte[] content = stream.readAllBytes();

            HttpHeaders headers = new HttpHeaders();
            headers.add("Content-Disposition", "attachment; filename=template_import_sanpham.xlsx");

            return ResponseEntity.ok()
                    .headers(headers)
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(content);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportProducts() {
        try {
            ByteArrayInputStream stream = excelService.exportProductsToExcel();
            byte[] content = stream.readAllBytes();

            HttpHeaders headers = new HttpHeaders();
            headers.add("Content-Disposition", "attachment; filename=products_export.xlsx");

            return ResponseEntity.ok()
                    .headers(headers)
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(content);
        } catch (IOException e) {
            log.error("❌ Lỗi khi export danh sách sản phẩm:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    //Lay dinh muc vat cho san pham
    @GetMapping("/product-materials/{productId}")
    public ResponseEntity<Page<ProductMaterialsDTO>> getMaterialsByProduct(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<ProductMaterialsDTO> materialsPage = productsService.getMaterialsByProduct(productId, pageable);
            return ResponseEntity.ok(materialsPage);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null); // Trả về null nếu không tìm thấy
        }
    }

    @GetMapping("/active")
    public ResponseEntity<Page<ProductsDTO>> getActiveProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(productsService.getActiveProducts(page, size));
    }
}