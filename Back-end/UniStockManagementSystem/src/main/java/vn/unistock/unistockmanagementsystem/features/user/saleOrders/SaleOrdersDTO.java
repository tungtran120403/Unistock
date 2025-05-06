package vn.unistock.unistockmanagementsystem.features.user.saleOrders;

import lombok.*;
import vn.unistock.unistockmanagementsystem.entities.SalesOrder;

import java.util.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleOrdersDTO {

    private Long orderId;
    private String orderCode;
    private Long partnerId;
    private String partnerCode;
    private String partnerName;
    private Date orderDate;
    private String note;
    private SalesOrder.OrderStatus status;
    private String purchaseRequestStatus; // NONE, REJECTED, APPROVED
    private String statusLabel; // Ví dụ: "Đang xử lý - yêu cầu bị từ chối"
    private String rejectionReason;

    private Set<SalesOrderDetailDTO> orderDetails = new HashSet<>();
    private List<SalesOrderMaterialDTO> materials = new ArrayList<>();
    private String address;
    private String phoneNumber;
    private String contactName;
}



