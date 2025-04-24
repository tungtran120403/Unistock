package vn.unistock.unistockmanagementsystem.features.user.saleOrders;

import lombok.Data;
import vn.unistock.unistockmanagementsystem.features.user.purchaseRequests.UsedProductWarehouseDTO;
import java.util.List;

@Data
public class PrepareMaterialForSaleOrderDTO {
    private Long saleOrderId;
    private List<UsedProductWarehouseDTO> usedProductsFromWarehouses;
    private List<UsedMaterialWarehouseDTO> usedMaterialsFromWarehouses;
}
