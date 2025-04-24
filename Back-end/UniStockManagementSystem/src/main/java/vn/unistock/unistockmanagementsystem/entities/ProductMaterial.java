package vn.unistock.unistockmanagementsystem.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "product_materials", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"product_id", "material_id"}) // ✅ Đảm bảo không lưu trùng vật tư
})
public class ProductMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;

    @Column(name = "quantity", nullable = false)
    private int quantity;

}
