package vn.unistock.unistockmanagementsystem.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "sales_order_details")
@EqualsAndHashCode(exclude = {"salesOrder", "product"})
@ToString(exclude = {"salesOrder", "product"})
public class SalesOrderDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_detail_id")
    private Long orderDetailId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private SalesOrder salesOrder;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "received_quantity", nullable = false)
    private Integer receivedQuantity = 0;

    @Column(name = "remaining_quantity", nullable = false)
    private Integer remainingQuantity;

    @OneToMany(mappedBy = "salesOrderDetail", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SalesOrderMaterial> materials;

    @PrePersist
    @PreUpdate
    private void updateRemainingQuantity() {
        this.remainingQuantity = this.quantity - this.receivedQuantity;
    }
}
