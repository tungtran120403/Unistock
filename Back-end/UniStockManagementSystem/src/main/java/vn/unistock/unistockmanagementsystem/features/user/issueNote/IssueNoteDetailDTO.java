package vn.unistock.unistockmanagementsystem.features.user.issueNote;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueNoteDetailDTO implements Serializable {
    // Các trường để CREATE/UPDATE
    private Long ginDetailsId;
    private Long ginId;
    private Long warehouseId;
    private Long materialId;
    private Long productId;
    private Double quantity;
    private Long unitId;

    // Các trường bổ sung để VIEW
    private String warehouseCode;
    private String warehouseName;
    private String materialCode;
    private String materialName;
    private String productCode;
    private String productName;
    private String unitName;

    // Tuỳ bạn có dùng referenceId / referenceType không
    private Long referenceId;
    private String referenceType;
}
