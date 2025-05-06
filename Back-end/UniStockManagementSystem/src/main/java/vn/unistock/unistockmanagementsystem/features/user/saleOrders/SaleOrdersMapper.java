package vn.unistock.unistockmanagementsystem.features.user.saleOrders;

import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import vn.unistock.unistockmanagementsystem.entities.SalesOrder;
import vn.unistock.unistockmanagementsystem.features.user.materials.MaterialsRepository;

import java.util.List;
import java.util.stream.Collectors;

@Mapper(
        componentModel = "spring",
        uses = { SaleOrdersDetailMapper.class, SalesOrderMaterialMapper.class }      // ⬅ thêm mapper vật tư
)
public interface SaleOrdersMapper {

    SaleOrdersMapper INSTANCE = Mappers.getMapper(SaleOrdersMapper.class);

    /* ---------- Entity ➜ DTO ---------- */
    @Mapping(source = "orderId",            target = "orderId")
    @Mapping(source = "orderCode",          target = "orderCode")
    @Mapping(source = "partner.partnerId",  target = "partnerId")
    @Mapping(source = "partner.partnerName",target = "partnerName")
    @Mapping(source = "partner.address",    target = "address")
    @Mapping(source = "partner.phone",      target = "phoneNumber")
    @Mapping(source = "status",             target = "status")
    @Mapping(source = "orderDate",          target = "orderDate")
    @Mapping(source = "note",               target = "note")
    @Mapping(source = "details",            target = "orderDetails")
    @Mapping(source = "materials", target = "materials")
    @Mapping(source = "rejectionReason",    target = "rejectionReason")
    @Mapping(
            target = "partnerCode",
            expression = """
            java(
                salesOrder.getPartner() != null
                && salesOrder.getPartner().getPartnerTypes() != null
                ? salesOrder.getPartner()
                          .getPartnerTypes()
                          .stream()
                          .filter(pbt -> pbt.getPartnerType() != null
                                         && pbt.getPartnerType().getTypeId() == 1)
                          .map(pbt -> pbt.getPartnerCode())
                          .findFirst()
                          .orElse(null)
                : null
            )
            """
    )
    @Mapping(source = "partner.contactName", target = "contactName")
    SaleOrdersDTO toDTO(SalesOrder salesOrder);

    default List<SaleOrdersDTO> toDTOList(List<SalesOrder> list) {
        return list == null ? null
                : list.stream().map(this::toDTO).collect(Collectors.toList());
    }

    /* ---------- DTO ➜ Entity ---------- */
    @Mapping(source = "orderId",       target = "orderId")
    @Mapping(source = "orderCode",     target = "orderCode")
    @Mapping(source = "partnerId",     target = "partner.partnerId")
    @Mapping(source = "partnerName",   target = "partner.partnerName")
    @Mapping(source = "address",       target = "partner.address")
    @Mapping(source = "phoneNumber",   target = "partner.phone")
    @Mapping(source = "contactName",   target = "partner.contactName")
    @Mapping(source = "status",        target = "status")
    @Mapping(source = "orderDate",     target = "orderDate")
    @Mapping(source = "note",          target = "note")
    @Mapping(source = "orderDetails",  target = "details")
    @Mapping(source = "materials", target = "materials")
    @Mapping(target  = "createdByUser", ignore = true)
    @Mapping(source = "rejectionReason", target = "rejectionReason")
    SalesOrder toEntity(SaleOrdersDTO dto,
                        @Context MaterialsRepository materialRepository);          // ⬅ truyền repo

    default List<SalesOrder> toEntityList(List<SaleOrdersDTO> list,
                                          @Context MaterialsRepository repo) {
        return list == null ? null
                : list.stream().map(dto -> toEntity(dto, repo)).collect(Collectors.toList());
    }
}
