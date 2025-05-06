package vn.unistock.unistockmanagementsystem.features.user.saleOrders;

import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import vn.unistock.unistockmanagementsystem.entities.SalesOrderDetail;
import vn.unistock.unistockmanagementsystem.features.user.materials.MaterialsRepository;

import java.util.List;
import java.util.stream.Collectors;

@Mapper(
        componentModel = "spring",
        uses = { SalesOrderMaterialMapper.class }     // ⬅ thêm
)
public interface SaleOrdersDetailMapper {

    SaleOrdersDetailMapper INSTANCE = Mappers.getMapper(SaleOrdersDetailMapper.class);

    /* ---------- Entity ➜ DTO ---------- */
    @Mapping(source = "orderDetailId",        target = "orderDetailId")
    @Mapping(source = "salesOrder.orderId",   target = "orderId")
    @Mapping(source = "product.productId",    target = "productId")
    @Mapping(source = "product.productName",  target = "productName")
    @Mapping(source = "product.unit.unitName",target = "unitName")
    @Mapping(source = "product.productCode",  target = "productCode")
    @Mapping(source = "remainingQuantity",    target = "remainingQuantity")
    @Mapping(source = "quantity",             target = "quantity")
    @Mapping(source = "receivedQuantity",     target = "receivedQuantity")
//    @Mapping(source = "materials",            target = "materials")
    SalesOrderDetailDTO toDTO(SalesOrderDetail entity);

    default List<SalesOrderDetailDTO> toDTOList(List<SalesOrderDetail> list) {
        return list == null ? null
                : list.stream().map(this::toDTO).collect(Collectors.toList());
    }

    /* ---------- DTO ➜ Entity ---------- */
    @Mapping(source = "productId",       target = "product.productId")
    @Mapping(source = "remainingQuantity", target = "remainingQuantity")
    @Mapping(source = "quantity",        target = "quantity")
    @Mapping(target  = "receivedQuantity",
            expression = "java(dto.getReceivedQuantity() == null ? 0 : dto.getReceivedQuantity())")
//    @Mapping(source = "materials",       target = "materials")
    @Mapping(source = "productCode",     target = "product.productCode")
    SalesOrderDetail toEntity(SalesOrderDetailDTO dto,
                              @Context MaterialsRepository materialRepository);    // ⬅ truyền repo

    default List<SalesOrderDetail> toEntityList(List<SalesOrderDetailDTO> list,
                                                @Context MaterialsRepository repo) {
        return list == null ? null
                : list.stream().map(d -> toEntity(d, repo)).collect(Collectors.toList());
    }
}
