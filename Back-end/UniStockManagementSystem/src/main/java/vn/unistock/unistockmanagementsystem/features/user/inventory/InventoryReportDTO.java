package vn.unistock.unistockmanagementsystem.features.user.inventory;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class InventoryReportDTO {
    private String itemCode;
    private String itemName;
    private Boolean isActive;
    private String unitName;
    private Double availableQuantity;
    private Double reservedQuantity;
    private Double totalQuantity;
    private String warehouseCode;
    private String warehouseName;
    private Long warehouseId;
    private String itemType;
    private Long productTypeId;
    private Long materialTypeId;
}
