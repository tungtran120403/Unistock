package vn.unistock.unistockmanagementsystem.features.user.materials;

import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Getter
@Setter
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialsDTO {

    private Long materialId;

    private String materialCode;
    private String materialName;

    private Long unitId;
    private String unitName;

    private Long typeId;
    private String typeName;

    private String description;
    private String imageUrl;
    private Boolean isUsing;
    private MultipartFile image;
    private List<Long> supplierIds;
    private Double lowStockThreshold;
}