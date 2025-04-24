package vn.unistock.unistockmanagementsystem.features.user.receiptnote;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.unistock.unistockmanagementsystem.entities.GoodReceiptDetail;

@Mapper(componentModel = "spring")
public interface ReceiptNoteDetailMapper {

        @Mapping(source = "warehouse.warehouseId", target = "warehouseId")
        @Mapping(source = "material.materialId", target = "materialId")
        @Mapping(source = "product.productId", target = "productId")
        @Mapping(source = "unit.unitId", target = "unitId")
        @Mapping(source = "goodReceiptNote.grnId", target = "grnId")
        ReceiptNoteDetailDTO toDTO(GoodReceiptDetail entity);

        @Mapping(source = "warehouseId", target = "warehouse.warehouseId")
        @Mapping(source = "materialId", target = "material.materialId")
        @Mapping(source = "productId", target = "product.productId")
        @Mapping(source = "unitId", target = "unit.unitId")
        GoodReceiptDetail toEntity(ReceiptNoteDetailDTO dto);
}
