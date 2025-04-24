package vn.unistock.unistockmanagementsystem.features.user.inventory;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class InventoryByWarehouseDTO {
    private Long warehouseId;
    private String warehouseName;
    private Double quantity;
}
