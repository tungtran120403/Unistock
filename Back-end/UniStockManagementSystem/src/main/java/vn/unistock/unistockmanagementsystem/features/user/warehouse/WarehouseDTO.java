package vn.unistock.unistockmanagementsystem.features.user.warehouse;

import jakarta.persistence.Column;
import lombok.*;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarehouseDTO {
    private Long warehouseId;
    private String warehouseCode;
    private String warehouseName;
    private String warehouseDescription;
    private Boolean isActive;
    private String goodCategory;
}
