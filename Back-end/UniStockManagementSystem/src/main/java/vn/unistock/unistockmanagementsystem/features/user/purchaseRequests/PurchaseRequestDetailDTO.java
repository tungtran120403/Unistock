package vn.unistock.unistockmanagementsystem.features.user.purchaseRequests;

import lombok.Data;


@Data
public class PurchaseRequestDetailDTO {
    private Long purchaseRequestDetailId;
    private Long materialId;
    private String materialCode;
    private String materialName;
    private String unitName;
    private Long partnerId;
    private String partnerName;
    private Integer quantity;
}