package vn.unistock.unistockmanagementsystem.features.user.saleOrders;

import lombok.Data;

@Data
public class UsedMaterialWarehouseDTO {
    private Long materialId;
    private Long warehouseId;
    private double quantity;
}
