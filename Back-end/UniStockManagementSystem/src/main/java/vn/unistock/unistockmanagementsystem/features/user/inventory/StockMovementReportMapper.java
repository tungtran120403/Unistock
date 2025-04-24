package vn.unistock.unistockmanagementsystem.features.user.inventory;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.unistock.unistockmanagementsystem.entities.Material;
import vn.unistock.unistockmanagementsystem.entities.Product;

@Mapper(componentModel = "spring")
public interface StockMovementReportMapper {
    @Mapping(target = "itemCode", source = "product.productCode")
    @Mapping(target = "itemName", source = "product.productName")
    @Mapping(target = "itemUnit", expression = "java(product.getUnit().getUnitName())")
    @Mapping(target = "itemType", constant = "PRODUCT")
    @Mapping(target = "beginQuantity", source = "begin")
    @Mapping(target = "inQuantity", source = "in")
    @Mapping(target = "outQuantity", source = "out")
    @Mapping(target = "endQuantity", source = "end")
    StockMovementReportDTO fromProduct(Product product,
                                       Double begin, Double in, Double out, Double end);

    @Mapping(target = "itemCode", source = "material.materialCode")
    @Mapping(target = "itemName", source = "material.materialName")
    @Mapping(target = "itemUnit", expression = "java(material.getUnit().getUnitName())")
    @Mapping(target = "itemType", constant = "MATERIAL")
    @Mapping(target = "beginQuantity", source = "begin")
    @Mapping(target = "inQuantity", source = "in")
    @Mapping(target = "outQuantity", source = "out")
    @Mapping(target = "endQuantity", source = "end")
    StockMovementReportDTO fromMaterial(Material material,
                                        Double begin, Double in, Double out, Double end);
}
