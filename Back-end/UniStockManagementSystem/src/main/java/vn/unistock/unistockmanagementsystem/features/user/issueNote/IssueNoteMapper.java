package vn.unistock.unistockmanagementsystem.features.user.issueNote;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.unistock.unistockmanagementsystem.entities.GoodIssueNote;

@Mapper(componentModel = "spring", uses = {IssueNoteDetailMapper.class})
public interface IssueNoteMapper {

    @Mapping(source = "createdBy.userId", target = "createdBy")
    @Mapping(source = "createdBy.username", target = "createdByUserName")
    @Mapping(source = "details", target = "details")
    @Mapping(source = "salesOrder.orderId", target = "soId")
    @Mapping(source = "salesOrder.orderCode", target = "soCode")
    @Mapping(source = "category", target = "category")
    @Mapping(source = "partner.partnerId", target = "partnerId")
    @Mapping(source = "partner.partnerName", target = "partnerName")
    @Mapping(source = "partner.address", target = "address")
    @Mapping(source = "partner.contactName", target = "contactName")
    @Mapping(source = "partner.phone", target = "phone")
    @Mapping(source = "receiver", target = "receiver")
    IssueNoteDTO toDTO(GoodIssueNote entity);

    @Mapping(source = "soId", target = "salesOrder.orderId")
    @Mapping(source = "soCode", target = "salesOrder.orderCode")
    @Mapping(source = "createdBy", target = "createdBy.userId")
    @Mapping(source = "details", target = "details")
    @Mapping(source = "category", target = "category")
    @Mapping(source = "partnerId", target = "partner.partnerId")
    @Mapping(source = "receiver", target = "receiver")
    @Mapping(target = "receiveOutsource", ignore = true)
    GoodIssueNote toEntity(IssueNoteDTO dto);
}