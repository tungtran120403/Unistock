package vn.unistock.unistockmanagementsystem.features.user.issueNote;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.unistock.unistockmanagementsystem.entities.ReceiveOutsourceMaterial;

@Mapper(componentModel = "spring")
public interface ReceiveOutsourceMaterialMapper {
    @Mapping(source = "material.materialId", target = "materialId")
    @Mapping(source = "material.materialCode", target = "materialCode")
    @Mapping(source = "material.materialName", target = "materialName")
    @Mapping(source = "unit.unitId", target = "unitId")
    @Mapping(source = "unit.unitName", target = "unitName")
    @Mapping(source = "quantity", target = "quantity")
    @Mapping(source = "receivedQuantity", target = "receivedQuantity")
    @Mapping(source = "remainingQuantity", target = "remainingQuantity")
    @Mapping(target = "warehouseId", ignore = true)
    @Mapping(target = "warehouseName", ignore = true)
    ReceiveOutsourceMaterialDTO toDTO(ReceiveOutsourceMaterial entity);
}
