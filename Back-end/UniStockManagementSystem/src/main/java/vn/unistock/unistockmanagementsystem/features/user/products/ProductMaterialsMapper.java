package vn.unistock.unistockmanagementsystem.features.user.products;

import vn.unistock.unistockmanagementsystem.entities.ProductMaterial;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProductMaterialsMapper {

    @Mapping(source = "material.materialId", target = "materialId")
    @Mapping(source = "material.materialCode", target = "materialCode")
    @Mapping(source = "material.materialName", target = "materialName")
    @Mapping(source = "material.unit.unitName", target = "unitName")
    ProductMaterialsDTO toDTO(ProductMaterial productMaterial);

    // ✨ Thêm chiều toEntity
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "material", ignore = true)
    ProductMaterial toEntity(ProductMaterialsDTO dto);
}
