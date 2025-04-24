package vn.unistock.unistockmanagementsystem.features.user.productTypes;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;
import vn.unistock.unistockmanagementsystem.entities.ProductType;

@Mapper(componentModel = "spring")
public interface ProductTypeMapper {
    ProductTypeMapper INSTANCE = Mappers.getMapper(ProductTypeMapper.class);

    ProductTypeDTO toDTO(ProductType productType);
    ProductType toEntity(ProductTypeDTO productTypeDTO);
}