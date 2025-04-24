package vn.unistock.unistockmanagementsystem.features.user.products;

import lombok.Data;

@Data
public class ProductPreviewDTO {
    private Integer rowIndex;
    private String productCode;
    private String productName;
    private String unitName;
    private String productTypeName;
    private String description;

    private boolean valid;
    private String errorMessage;
}
