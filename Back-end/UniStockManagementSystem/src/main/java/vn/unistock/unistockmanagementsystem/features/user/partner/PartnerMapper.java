package vn.unistock.unistockmanagementsystem.features.user.partner;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import vn.unistock.unistockmanagementsystem.entities.Partner;
import vn.unistock.unistockmanagementsystem.features.user.partner.partnerByType.PartnerByTypeDTO;
import vn.unistock.unistockmanagementsystem.features.user.partnerType.PartnerTypeDTO;
import vn.unistock.unistockmanagementsystem.features.user.partnerType.PartnerTypeMapper;

import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", uses = {PartnerTypeMapper.class})
public interface PartnerMapper {
    PartnerMapper INSTANCE = Mappers.getMapper(PartnerMapper.class);

    @Mapping(source = "partnerId", target = "partnerId")
    @Mapping(source = "partnerName", target = "partnerName")
    @Mapping(source = "contactName", target = "contactName")
    @Mapping(source = "address", target = "address")
    @Mapping(source = "phone", target = "phone")
    @Mapping(source = "email", target = "email")
    @Mapping(target = "partnerTypes", expression = "java(mapPartnerTypes(partner))")
    PartnerDTO toDTO(Partner partner);

    Partner toEntity(PartnerDTO partnerDTO);

    default Set<PartnerByTypeDTO> mapPartnerTypes(Partner partner) {
        return partner.getPartnerTypes().stream()
                .map(pt -> PartnerByTypeDTO.builder()
                        .partnerType(PartnerTypeMapper.INSTANCE.toDTO(pt.getPartnerType())) // Chuyển PartnerType thành DTO
                        .partnerCode(pt.getPartnerCode()) // Lấy partnerCode từ PartnerByType
                        .build()
                )
                .collect(Collectors.toSet());
    }
}
