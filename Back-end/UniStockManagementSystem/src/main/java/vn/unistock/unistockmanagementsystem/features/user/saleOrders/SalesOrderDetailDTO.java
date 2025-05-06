package vn.unistock.unistockmanagementsystem.features.user.saleOrders;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesOrderDetailDTO {

    private Long orderDetailId;
    private Long orderId;
    private Long productId;
    private String productCode;
    private String productName; // Added for UI display
    private Integer quantity;
    private Integer receivedQuantity;
    private Integer remainingQuantity;
    private String unitName; // Đơn vị tính
//    private List<SalesOrderMaterialDTO> materials = new ArrayList<>();

}