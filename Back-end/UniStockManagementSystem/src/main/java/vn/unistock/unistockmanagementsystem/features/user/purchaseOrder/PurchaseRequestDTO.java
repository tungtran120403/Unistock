package vn.unistock.unistockmanagementsystem.features.user.purchaseOrder;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseRequestDTO {
    private List<PurchaseRequestItemDTO> items;
}
