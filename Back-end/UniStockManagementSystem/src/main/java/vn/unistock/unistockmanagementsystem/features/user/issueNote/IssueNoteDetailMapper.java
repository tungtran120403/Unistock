package vn.unistock.unistockmanagementsystem.features.user.issueNote;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.unistock.unistockmanagementsystem.entities.GoodIssueDetail;

@Mapper(componentModel = "spring")
public interface IssueNoteDetailMapper {

    // Map từ entity -> DTO
    @Mapping(source = "goodIssueNote.ginId",     target = "ginId")
    @Mapping(source = "ginDetailsId",           target = "ginDetailsId")

    // Warehouse
    @Mapping(source = "warehouse.warehouseId",   target = "warehouseId")
    @Mapping(source = "warehouse.warehouseCode", target = "warehouseCode")
    @Mapping(source = "warehouse.warehouseName", target = "warehouseName")

    // Material
    @Mapping(source = "material.materialId",     target = "materialId")
    @Mapping(source = "material.materialCode",   target = "materialCode")
    @Mapping(source = "material.materialName",   target = "materialName")

    // Product
    @Mapping(source = "product.productId",       target = "productId")
    @Mapping(source = "product.productCode",     target = "productCode")
    @Mapping(source = "product.productName",     target = "productName")

    // Unit
    @Mapping(source = "unit.unitId",             target = "unitId")
    @Mapping(source = "unit.unitName",           target = "unitName")

    // Quantity
    @Mapping(source = "quantity",                target = "quantity")
    IssueNoteDetailDTO toDTO(GoodIssueDetail entity);


    // Map từ DTO -> entity
    @Mapping(source = "ginId",         target = "goodIssueNote.ginId")
    @Mapping(source = "ginDetailsId",  target = "ginDetailsId")

    // Warehouse
    @Mapping(source = "warehouseId",   target = "warehouse.warehouseId")

    // Material
    @Mapping(source = "materialId",    target = "material.materialId")

    // Product
    @Mapping(source = "productId",     target = "product.productId")

    // Unit
    @Mapping(source = "unitId",        target = "unit.unitId")

    // Quantity
    @Mapping(source = "quantity",      target = "quantity")
    GoodIssueDetail toEntity(IssueNoteDetailDTO dto);
}
