package vn.unistock.unistockmanagementsystem.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

@Data
@Entity
@Getter
@Setter
@Table(name = "warehouse")
public class Warehouse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "warehouse_id")
    private Long warehouseId;

    @Column(name = "warehouse_code", unique = true)
    @NotBlank(message = "Tên kho không được để trống")
    private String warehouseCode;

    @Column(name = "warehouse_name", unique = true)
    @NotBlank(message = "Tên kho không được để trống")
    private String warehouseName;

    @Column(name = "warehouse_description")
    @Size(max=255, message = "Trường mô tả quá dài")
    private String warehouseDescription;

    @Column(name = "is_active")
    @ColumnDefault("true")
    private Boolean isActive = true;

    private String goodCategory;
}
