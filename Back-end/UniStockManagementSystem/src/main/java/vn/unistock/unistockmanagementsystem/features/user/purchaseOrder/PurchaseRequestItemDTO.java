package vn.unistock.unistockmanagementsystem.features.user.purchaseOrder;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseRequestItemDTO {
    private Long materialId;
    private String materialCode;
    private String materialName;
    private Long supplierId;
    private String supplierName;
    private String unit;
    private Integer quantity;
}
