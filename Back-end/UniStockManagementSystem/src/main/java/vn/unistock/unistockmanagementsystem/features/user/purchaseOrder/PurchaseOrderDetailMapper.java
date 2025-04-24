package vn.unistock.unistockmanagementsystem.features.user.purchaseOrder;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import vn.unistock.unistockmanagementsystem.entities.PurchaseOrderDetail;

@Mapper(componentModel = "spring")
public interface PurchaseOrderDetailMapper {
    PurchaseOrderDetailMapper INSTANCE = Mappers.getMapper(PurchaseOrderDetailMapper.class);

    @Mapping(source = "material.materialId", target = "materialId")
    @Mapping(source = "material.materialCode", target = "materialCode")
    @Mapping(source = "material.materialName", target = "materialName")
    @Mapping(source = "material.unit.unitName", target = "unit")
    PurchaseOrderDetailDTO toDTO(PurchaseOrderDetail detail);

    PurchaseOrderDetail toEntity(PurchaseOrderDetailDTO dto);


}
