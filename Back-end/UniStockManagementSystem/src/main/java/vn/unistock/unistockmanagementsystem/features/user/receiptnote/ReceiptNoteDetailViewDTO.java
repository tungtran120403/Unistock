package vn.unistock.unistockmanagementsystem.features.user.receiptnote;

import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceiptNoteDetailViewDTO implements Serializable {
    private Long grnDetailsId;
    private Long grnId;
    private Long warehouseId;
    private String warehouseCode;
    private String warehouseName;
    private Long materialId;
    private String materialCode;
    private String materialName;
    private Long productId;
    private String productCode;
    private String productName;
    private Double quantity;
    private Long unitId;
    private String unitName;
    private Long referenceId;
    private String referenceType;
    private String grnCode;
    private String category;
    private LocalDateTime receiptDate;
    private String itemType;
}
