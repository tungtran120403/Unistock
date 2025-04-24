package vn.unistock.unistockmanagementsystem.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "material_types")
public class MaterialType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "material_type_id")
    private Long materialTypeId;

    @Column(name = "type_name", nullable = false)
    private String name;

    @Column(name = "is_using_active", nullable = false)
    private boolean status = true;

    private String description;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String createdBy;
    private String updatedBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}