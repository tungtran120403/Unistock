package vn.unistock.unistockmanagementsystem.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Getter
@Setter
@Entity
@Table(name = "sales_order_materials", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"order_detail_id", "material_id"})
})
public class SalesOrderMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_detail_id", nullable = false)
    private SalesOrderDetail salesOrderDetail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;

    @Column(name = "required_quantity")
    private int requiredQuantity = 0;

    @Column(name = "received_quantity")
    private int receivedQuantity = 0;
}