package vn.unistock.unistockmanagementsystem.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
@Entity
@Table(name = "purchase_order_details")
public class PurchaseOrderDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "po_detail_id")
    private Long poDetailId;

    @ManyToOne
    @JoinColumn(name = "po_id", nullable = false)
    private PurchaseOrder purchaseOrder; // Liên kết với PurchaseOrder

    @ManyToOne
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;

    @Min(value = 1, message = "Ordered quantity must be at least 1")
    @Column(name = "ordered_quantity", nullable = false)
    private Integer orderedQuantity;

    @Column(name = "received_quantity", nullable = false)
    private Integer receivedQuantity = 0; // Mặc định là 0 khi tạo mới

    @Column(name = "remaining_quantity", nullable = false)
    private Integer remainingQuantity;

    @PrePersist
    @PreUpdate
    private void updateRemainingQuantity() {
        this.remainingQuantity = this.orderedQuantity - this.receivedQuantity;
    }
}
