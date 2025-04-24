package vn.unistock.unistockmanagementsystem.features.user.products;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.factory.Mappers;
import vn.unistock.unistockmanagementsystem.entities.Product;
import vn.unistock.unistockmanagementsystem.entities.ProductMaterial;
import vn.unistock.unistockmanagementsystem.entities.ProductType;
import vn.unistock.unistockmanagementsystem.entities.Unit;

import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface ProductsMapper {
    ProductsMapper INSTANCE = Mappers.getMapper(ProductsMapper.class);

    // Ánh xạ từ Product sang ProductsDTO
    @Mapping(source = "unit.unitId", target = "unitId")
    @Mapping(source = "unit.unitName", target = "unitName")
    @Mapping(source = "productType.typeId", target = "typeId")
    @Mapping(source = "productType.typeName", target = "typeName")
    @Mapping(source = "productMaterials", target = "materials", qualifiedByName = "mapProductMaterialsToDTOs")
    ProductsDTO toDTO(Product product);

    // Ánh xạ từ ProductsDTO sang Product (dùng cho tạo/cập nhật)
    @Mapping(source = "unitId", target = "unit", qualifiedByName = "mapUnitIdToUnit")
    @Mapping(source = "typeId", target = "productType", qualifiedByName = "mapTypeIdToProductType")
    @Mapping(target = "productMaterials", ignore = true)
    Product toEntity(ProductsDTO dto);

    @Named("mapProductMaterialsToDTOs")
    default List<ProductMaterialsDTO> mapProductMaterialsToDTOs(List<ProductMaterial> productMaterials) {
        if (productMaterials == null) {
            return null;
        }
        return productMaterials.stream()
                .map(this::mapProductMaterialToDTO)
                .collect(Collectors.toList());
    }

    // Ánh xạ một ProductMaterial sang ProductMaterialsDTO
    @Mapping(source = "material.materialId", target = "materialId")
    @Mapping(source = "material.materialCode", target = "materialCode")
    @Mapping(source = "material.materialName", target = "materialName")
    @Mapping(source = "quantity", target = "quantity")
    ProductMaterialsDTO mapProductMaterialToDTO(ProductMaterial productMaterial);

    // Ánh xạ unitId sang Unit (dùng trong toEntity)
    @Named("mapUnitIdToUnit")
    default Unit mapUnitIdToUnit(Long unitId) {
        return null;
    }

    // Ánh xạ typeId sang ProductType (dùng trong toEntity)
    @Named("mapTypeIdToProductType")
    default ProductType mapTypeIdToProductType(Long typeId) {
        return null;
    }
}