package vn.unistock.unistockmanagementsystem.features.user.purchaseRequests;

import lombok.Data;

@Data
public class UsedProductWarehouseDTO {
    private Long productId;
    private Long warehouseId;
    private double quantity;
}
