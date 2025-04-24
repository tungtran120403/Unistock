package vn.unistock.unistockmanagementsystem.features.user.purchaseOrder;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrderDetailDTO {
    private Long poDetailId;
    private Long materialId;
    private String materialCode;
    private String materialName;
    private String unit;
    private Integer orderedQuantity;
    private Integer receivedQuantity;
    private Integer remainingQuantity;


}
