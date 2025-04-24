package vn.unistock.unistockmanagementsystem.features.user.partnerType;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import vn.unistock.unistockmanagementsystem.entities.PartnerType;

@Mapper(componentModel = "spring")
public interface PartnerTypeMapper {
    PartnerTypeMapper INSTANCE = Mappers.getMapper(PartnerTypeMapper.class);

    // 🟢 Chuyển từ Entity -> DTO
    @Mapping(source = "typeId", target = "typeId")
    @Mapping(source = "typeCode", target = "typeCode")
    @Mapping(source = "typeName", target = "typeName")
    @Mapping(source = "status", target = "status")
    @Mapping(source = "description", target = "description")
    PartnerTypeDTO toDTO(PartnerType partnerType);

    // 🟢 Chuyển từ DTO -> Entity
    PartnerType toEntity(PartnerTypeDTO partnerTypeDTO);
}