package vn.unistock.unistockmanagementsystem.features.user.purchaseRequests;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.unistock.unistockmanagementsystem.entities.PurchaseRequestDetail;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PurchaseRequestDetailMapper {
    @Mapping(source = "purchaseRequestDetailId", target = "purchaseRequestDetailId") // Thêm ánh xạ cho ID
    @Mapping(source = "material.materialId", target = "materialId")
    @Mapping(source = "material.materialCode", target = "materialCode")
    @Mapping(source = "material.materialName", target = "materialName")
    @Mapping(source = "material.unit.unitName", target = "unitName")
    @Mapping(source = "partner.partnerId", target = "partnerId")
    @Mapping(source = "partner.partnerName", target = "partnerName")
    @Mapping(source = "quantity", target = "quantity")
    PurchaseRequestDetailDTO toDTO(PurchaseRequestDetail entity);

    List<PurchaseRequestDetailDTO> toDTOList(List<PurchaseRequestDetail> entities);

    @Mapping(source = "purchaseRequestDetailId", target = "purchaseRequestDetailId") // Thêm ánh xạ cho ID
    @Mapping(source = "materialId", target = "material.materialId")
    @Mapping(source = "partnerId", target = "partner.partnerId")
    @Mapping(source = "quantity", target = "quantity")
    PurchaseRequestDetail toEntity(PurchaseRequestDetailDTO dto);

    List<PurchaseRequestDetail> toEntityList(List<PurchaseRequestDetailDTO> dtos);
}