package vn.unistock.unistockmanagementsystem.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_transaction")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long transactionId;

    @ManyToOne
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @ManyToOne
    @JoinColumn(name = "material_id")
    private Material material;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @CreationTimestamp
    private LocalDateTime transactionDate;

    @Enumerated(EnumType.STRING)
    private TransactionType transactionType;

    @Column(nullable = false)
    private Double quantity;

    @ManyToOne
    @JoinColumn(name = "grn_id")
    private GoodReceiptNote goodReceiptNote;

    @ManyToOne
    @JoinColumn(name = "gin_id")
    private GoodIssueNote goodIssueNote;

    @Enumerated(EnumType.STRING)
    private NoteType referenceType;

    public enum TransactionType {
        IMPORT, EXPORT
    }

    public enum NoteType {
        GOOD_RECEIPT_NOTE,
        GOOD_ISSUE_NOTE
    }

}

