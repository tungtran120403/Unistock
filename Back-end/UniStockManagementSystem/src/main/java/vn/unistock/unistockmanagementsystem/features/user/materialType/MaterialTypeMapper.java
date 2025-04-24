package vn.unistock.unistockmanagementsystem.features.user.materialType;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import vn.unistock.unistockmanagementsystem.entities.MaterialType;

@Mapper(componentModel = "spring")
public interface MaterialTypeMapper {
    MaterialTypeMapper INSTANCE = Mappers.getMapper(MaterialTypeMapper.class);

    MaterialTypeDTO toDTO(MaterialType materialType);
    MaterialType toEntity(MaterialTypeDTO dto);
}