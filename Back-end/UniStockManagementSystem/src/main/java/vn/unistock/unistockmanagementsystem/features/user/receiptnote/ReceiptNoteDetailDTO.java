package vn.unistock.unistockmanagementsystem.features.user.receiptnote;

import jakarta.persistence.*;
import lombok.*;
import vn.unistock.unistockmanagementsystem.entities.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceiptNoteDetailDTO {
    private Long grnDetailsId;
    private Long grnId;
    private Long warehouseId;
    private Long materialId;
    private Long productId;
    private Double quantity;
    private Long unitId;
}
