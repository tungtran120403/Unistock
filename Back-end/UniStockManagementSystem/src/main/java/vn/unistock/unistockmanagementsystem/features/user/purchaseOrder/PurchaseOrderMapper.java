package vn.unistock.unistockmanagementsystem.features.user.purchaseOrder;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import vn.unistock.unistockmanagementsystem.entities.PurchaseOrder;

@Mapper(componentModel = "spring")
public interface PurchaseOrderMapper {
    PurchaseOrderMapper INSTANCE = Mappers.getMapper(PurchaseOrderMapper.class);

    @Mapping(source = "partner.partnerId", target = "supplierId")
    @Mapping(source = "partner.partnerName", target = "supplierName")
    @Mapping(source = "partner.contactName", target = "supplierContactName")
    @Mapping(source = "partner.phone", target = "supplierPhone")
    @Mapping(source = "details", target = "details")
    @Mapping(source = "purchaseRequest.purchaseRequestCode", target = "purchaseRequestCode")
    @Mapping(source = "purchaseRequest.purchaseRequestId", target = "purchaseRequestId")
    PurchaseOrderDTO toDTO(PurchaseOrder purchaseOrder);

    @Mapping(source = "supplierId", target = "partner.partnerId")
    PurchaseOrder toEntity(PurchaseOrderDTO purchaseOrderDTO);
}
