package vn.unistock.unistockmanagementsystem.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Data
@Entity
@Table(name = "materials")
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "material_id")
    private Long materialId;

    @Column(name = "material_code", nullable = false, unique = true)
    private String materialCode;

    @Column(name = "material_name", nullable = false)
    private String materialName;

    @ManyToOne
    @JoinColumn(name = "unit_id", nullable = false)
    private Unit unit;

    @ManyToOne
    @JoinColumn(name = "type_id", nullable = false)
    private MaterialType materialType;

    private String description;

    @Column(name = "is_using_active", nullable = false)
    private Boolean isUsing = true;

    @Column(name = "image_url")
    private String imageUrl;

    @OneToMany(mappedBy = "material", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<MaterialPartner> materialPartners = new ArrayList<>();

}
