package vn.unistock.unistockmanagementsystem.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "purchase_request_details")
@Data
public class PurchaseRequestDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long purchaseRequestDetailId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_id", nullable = false)
    private PurchaseRequest purchaseRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id", nullable = false)
    private Partner partner;

    @Column(nullable = false)
    private Integer quantity;
}