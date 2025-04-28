package vn.unistock.unistockmanagementsystem.features.user.issueNote;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceiveOutsourceMaterialDTO {
    private Long id;
    private Long materialId;
    private String materialCode;
    private String materialName;
    private Double quantity;
    private Double receivedQuantity;
    private Double remainingQuantity;
    private Long unitId;
    private String unitName;
    private Long warehouseId;
    private String warehouseName;
}