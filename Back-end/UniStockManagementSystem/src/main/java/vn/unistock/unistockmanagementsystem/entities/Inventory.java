package vn.unistock.unistockmanagementsystem.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventory")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long inventoryId;

    @ManyToOne
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @ManyToOne
    @JoinColumn(name = "material_id")
    private Material material;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(nullable = false)
    private Double quantity = 0.0;

    @Enumerated(EnumType.STRING)
    private InventoryStatus status;

    @ManyToOne
    @JoinColumn(name = "order_id")
    private SalesOrder salesOrder;

    @Column(name = "last_updated", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    private LocalDateTime lastUpdated;
    public enum InventoryStatus {
        AVAILABLE,
        RESERVED
    }
}
