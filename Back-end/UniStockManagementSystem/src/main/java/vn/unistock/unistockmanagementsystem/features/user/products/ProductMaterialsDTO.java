package vn.unistock.unistockmanagementsystem.features.user.products;

import lombok.Data;

@Data
public class ProductMaterialsDTO {
    private Long productMaterialId;
    private Long materialId;
    private String materialCode;
    private String materialName;
    private Integer quantity;
    private String unitName;

}