//package vn.unistock.unistockmanagementsystem.features.user.materialPartners;
//
//import org.mapstruct.Mapper;
//import org.mapstruct.Mapping;
//import org.mapstruct.factory.Mappers;
//import vn.unistock.unistockmanagementsystem.entities.MaterialPartner;
//
//@Mapper(componentModel = "spring")
//public interface MaterialPartnerMapper {
//    MaterialPartnerMapper INSTANCE = Mappers.getMapper(MaterialPartnerMapper.class);
//
//    @Mapping(source = "material.materialId", target = "materialId")
//    @Mapping(source = "partner.partnerId", target = "partnerId")
//    MaterialPartnerDTO toDTO(MaterialPartner materialPartner);
//}