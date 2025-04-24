package vn.unistock.unistockmanagementsystem.features.user.receiptnote;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.unistock.unistockmanagementsystem.entities.GoodReceiptDetail;

@Mapper(componentModel = "spring")

public interface ReceiptNoteDetailViewMapper {
    @Mapping(source = "goodReceiptNote.grnId", target = "grnId")
    @Mapping(source = "warehouse.warehouseId", target = "warehouseId")
    @Mapping(source = "warehouse.warehouseCode", target = "warehouseCode")
    @Mapping(source = "warehouse.warehouseName", target = "warehouseName")
    @Mapping(source = "material.materialId", target = "materialId")
    @Mapping(source = "material.materialCode", target = "materialCode")
    @Mapping(source = "material.materialName", target = "materialName")
    @Mapping(source = "product.productId", target = "productId")
    @Mapping(source = "product.productCode", target = "productCode")
    @Mapping(source = "product.productName", target = "productName")
    @Mapping(source = "unit.unitId", target = "unitId")
    @Mapping(source = "unit.unitName", target = "unitName")
    @Mapping(source = "goodReceiptNote.grnCode", target = "grnCode")
    @Mapping(source = "goodReceiptNote.category", target = "category")
    @Mapping(source = "goodReceiptNote.receiptDate", target = "receiptDate")
    ReceiptNoteDetailViewDTO toViewDTO(GoodReceiptDetail entity);
}
