package vn.unistock.unistockmanagementsystem.features.user.saleOrders;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesOrderMaterialDTO {
    private Long materialId;
    private String  materialCode;   // ⬅ NEW
    private String  materialName;   // ⬅ NEW
    private String  unitName;
    private Integer requiredQuantity;
    private Integer receivedQuantity;
    private Long orderId;
}
