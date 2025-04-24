package vn.unistock.unistockmanagementsystem.features.user.inventory;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StockMovementReportDTO {
    private String itemCode;
    private String itemName;
    private String itemUnit;
    private String itemType; // "PRODUCT" hoặc "MATERIAL"
    private Double beginQuantity;
    private Double inQuantity;
    private Double outQuantity;
    private Double endQuantity;
}
