package vn.unistock.unistockmanagementsystem.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.PastOrPresent;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "good_receipt_note")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodReceiptNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long grnId;

    @Column(name = "grn_code", length = 50, unique = true, nullable = false)
    @NotBlank(message = "GRN code cannot be blank")
    private String grnCode;

    @ManyToOne
    @JoinColumn(name = "po_id", nullable = true)
    private PurchaseOrder purchaseOrder;

    @ManyToOne
    @JoinColumn(name = "gin_id")
    private GoodIssueNote goodIssueNote;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "category", nullable = false)
    private String category;

    private LocalDateTime receiptDate;

    @ManyToOne
    @JoinColumn(name = "partner_id")
    private Partner partner;

    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    @NotNull(message = "Created by is required")
    private User createdBy;

    @OneToMany(mappedBy = "goodReceiptNote", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GoodReceiptDetail> details;

}
