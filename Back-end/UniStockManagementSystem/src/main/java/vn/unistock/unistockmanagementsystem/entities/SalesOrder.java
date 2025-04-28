package vn.unistock.unistockmanagementsystem.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Data
@Entity
@Table(name = "sales_orders")
@EqualsAndHashCode(exclude = "details")
@ToString(exclude = "details")
public class SalesOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "order_code", length = 20, unique = true)
    private String orderCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id", nullable = false)
    private Partner partner;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "order_date", nullable = false)
    private Date orderDate;

    // Ai tạo (nhiều order -> 1 user)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdByUser;

    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.PROCESSING;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    // Audit
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "salesOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SalesOrderDetail> details;

    @OneToMany(mappedBy = "salesOrder")
    private List<PurchaseRequest> purchaseRequests;


    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }



    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum OrderStatus {
        PROCESSING,          // Đang xử lý
        PREPARING_MATERIAL, // Đang chuẩn bị vật tư
        CANCELLED,           // Đã hủy
        PROCESSING_NO_REQUEST, // Chưa có yêu cầu
        PROCESSING_PENDING_REQUEST, // Đang chờ yêu cầu mua được duyệt
        PROCESSING_REJECTED_REQUEST,
        COMPLETE_ISSUED_MATERIAL,// ngọc mới thêm status xuất đủ vật tư để sản xuất
        PARTIALLY_ISSUED, // Đã xuất 1 phần
        COMPLETED, // Đã hoàn thành
    }
    @JsonIgnore
    public String getStatusLabel() {
        return switch (status) {
            case PROCESSING -> "Đang xử lý";
            case PREPARING_MATERIAL -> "Đang chuẩn bị vật tư";
            case CANCELLED -> "Đã hủy";
            case PROCESSING_NO_REQUEST -> "Chưa có yêu cầu";
            case PROCESSING_PENDING_REQUEST -> "Yêu cầu đang chờ duyệt";
            case PROCESSING_REJECTED_REQUEST -> "Yêu cầu bị từ chối";
            case COMPLETE_ISSUED_MATERIAL -> "Đã xuất đủ vật tư";
            case PARTIALLY_ISSUED -> "Đã xuất một phần";
            case COMPLETED -> "Đã hoàn thành";
        };
    }

}
