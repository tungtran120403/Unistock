package vn.unistock.unistockmanagementsystem.features.user.receiptnote;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import vn.unistock.unistockmanagementsystem.entities.GoodReceiptNote;

@Mapper(componentModel = "spring", uses = {ReceiptNoteDetailMapper.class})
public interface ReceiptNoteMapper {

    @Mapping(source = "createdBy.userId", target = "createdBy")
    @Mapping(source = "details", target = "details")
    @Mapping(source = "purchaseOrder.poId", target = "poId")
    @Mapping(source = "category", target = "category")
    @Mapping(source = "partner.partnerId", target = "partnerId")
    @Mapping(source = "partner.partnerName", target = "partnerName")
    @Mapping(source = "partner.address", target = "address")
    @Mapping(source = "partner.contactName", target = "contactName")
    @Mapping(source = "partner.phone", target = "phone")
    @Mapping(source = "createdBy.username", target = "createdByUsername")
    @Mapping(source = "createdBy.email", target = "createdByEmail")
    @Mapping(source = "purchaseOrder.poCode", target = "poCode")
    @Mapping(source = "goodIssueNote.ginCode", target = "ginCode")
    ReceiptNoteDTO toDTO(GoodReceiptNote entity);

    @Mapping(source = "poId", target = "purchaseOrder.poId")
    @Mapping(source = "createdBy", target = "createdBy.userId")
    @Mapping(source = "details", target = "details")
    @Mapping(source = "category", target = "category")
    @Mapping(source = "partnerId", target = "partner.partnerId")
    GoodReceiptNote toEntity(ReceiptNoteDTO dto);
}
