package vn.unistock.unistockmanagementsystem.features.user.purchaseRequests;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.unistock.unistockmanagementsystem.entities.PurchaseRequest;

@Mapper(componentModel = "spring", uses = {PurchaseRequestDetailMapper.class})
public interface PurchaseRequestMapper {

    @Mapping(source = "purchaseRequestId", target = "purchaseRequestId")
    @Mapping(source = "purchaseRequestCode", target = "purchaseRequestCode")
    @Mapping(source = "createdDate", target = "createdDate")
    @Mapping(source = "notes", target = "notes")
    @Mapping(source = "status", target = "status")
    @Mapping(source = "rejectionReason", target = "rejectionReason") // 🆕
    @Mapping(source = "salesOrder.orderId", target = "saleOrderId")
    @Mapping(source = "salesOrder.orderCode", target = "saleOrderCode")
    @Mapping(source = "purchaseRequestDetails", target = "purchaseRequestDetails")
    PurchaseRequestDTO toDTO(PurchaseRequest entity);

    @Mapping(source = "purchaseRequestId", target = "purchaseRequestId")
    @Mapping(source = "purchaseRequestCode", target = "purchaseRequestCode")
    @Mapping(source = "createdDate", target = "createdDate")
    @Mapping(source = "notes", target = "notes")
    @Mapping(source = "status", target = "status")
    @Mapping(source = "rejectionReason", target = "rejectionReason") // 🆕
    @Mapping(source = "purchaseRequestDetails", target = "purchaseRequestDetails")
    PurchaseRequest toEntity(PurchaseRequestDTO dto);
}

