package vn.unistock.unistockmanagementsystem.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "good_issue_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodIssueDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ginDetailsId;

    @ManyToOne
    @JoinColumn(name = "gin_id", nullable = false)
    private GoodIssueNote goodIssueNote;

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