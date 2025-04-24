package vn.unistock.unistockmanagementsystem.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "receive_outsource")
@Getter
@Setter
public class ReceiveOutsource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "outsource_id")
    private Long outsourceId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gin_id", nullable = false)
    private GoodIssueNote goodIssueNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id", nullable = false)
    private Partner partner;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OutsourceStatus status = OutsourceStatus.PENDING;

    @OneToMany(mappedBy = "receiveOutsource", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReceiveOutsourceMaterial> materials = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;


    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum OutsourceStatus {
        PENDING("Đã xuất"),
        IN_PROGRESS("Đang gia công"),
        COMPLETED("Đã nhận hàng gia công"),
        CANCELED("Hủy");

        private final String label;

        OutsourceStatus(String label) {
            this.label = label;
        }

        public String getLabel() {
            return label;
        }
    }
}