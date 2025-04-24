package vn.unistock.unistockmanagementsystem.features.user.warehouse;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.factory.Mappers;
import vn.unistock.unistockmanagementsystem.entities.Warehouse;

@Mapper(componentModel = "spring")
public interface WarehouseMapper {
    WarehouseMapper INSTANCE = Mappers.getMapper(WarehouseMapper.class);
    @Mapping(target = "warehouseId", ignore = true)
    Warehouse toEntity(WarehouseDTO warehouse);

    @Mapping(target = "warehouseId", ignore = true)
    WarehouseDTO toDTO(Warehouse warehouse);

    @Mapping(target = "warehouseId", ignore = true)
    @Mapping(target = "warehouseCode", ignore = true)
    void updateEntityFromDto(WarehouseDTO warehouseDTO, @MappingTarget Warehouse warehouse);

}
