package vn.unistock.unistockmanagementsystem.features.user.units;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;
import vn.unistock.unistockmanagementsystem.entities.Unit;

@Mapper(componentModel = "spring")
public interface UnitMapper {
    UnitMapper INSTANCE = Mappers.getMapper(UnitMapper.class);

    UnitDTO toDTO(Unit unit);
    Unit toEntity(UnitDTO unitDTO);
}