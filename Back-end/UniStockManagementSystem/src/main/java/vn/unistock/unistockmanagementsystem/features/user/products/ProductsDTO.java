package vn.unistock.unistockmanagementsystem.features.user.products;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProductsDTO {
    private Long productId;
    private String productCode;
    private String productName;
    private String description;
    private Long unitId;
    private String unitName;
    private Long typeId;
    private String typeName;
    private Boolean isProductionActive;
    private String imageUrl;
    private MultipartFile image; // Dùng cho upload file
    private List<ProductMaterialsDTO> materials; // Danh sách định mức vật tư
}