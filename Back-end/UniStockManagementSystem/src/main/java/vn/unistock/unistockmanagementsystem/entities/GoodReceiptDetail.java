package vn.unistock.unistockmanagementsystem.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "good_receipt_detail")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodReceiptDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long grnDetailsId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grn_id", nullable = false)
    private GoodReceiptNote goodReceiptNote;

    @ManyToOne
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @ManyToOne
    @JoinColumn(name = "material_id", nullable = true)
    private Material material;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = true)
    private Product product;

    @ManyToOne
    @JoinColumn(name = "unit_id")
    private Unit unit;

    @Column(nullable = false)
    private Double quantity;
}
