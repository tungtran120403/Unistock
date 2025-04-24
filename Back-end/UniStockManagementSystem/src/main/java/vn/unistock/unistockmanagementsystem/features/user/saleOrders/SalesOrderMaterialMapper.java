package vn.unistock.unistockmanagementsystem.features.user.saleOrders;

import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import vn.unistock.unistockmanagementsystem.entities.Material;
import vn.unistock.unistockmanagementsystem.entities.SalesOrderMaterial;
import vn.unistock.unistockmanagementsystem.features.user.materials.MaterialsRepository;

import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface SalesOrderMaterialMapper {
    SalesOrderMaterialMapper INSTANCE = Mappers.getMapper(SalesOrderMaterialMapper.class);

    // Ánh xạ từ SalesOrderMaterial (Entity) → SalesOrderMaterialDTO (DTO)
    @Mapping(source = "material.materialId", target = "materialId")
    @Mapping(source = "material.materialCode",  target = "materialCode")
    @Mapping(source = "material.materialName",  target = "materialName")
    @Mapping(source = "material.unit.unitName", target = "unitName")
    @Mapping(source = "requiredQuantity", target = "requiredQuantity")
    @Mapping(source = "receivedQuantity", target = "receivedQuantity")
    SalesOrderMaterialDTO toDTO(SalesOrderMaterial entity);

    default List<SalesOrderMaterialDTO> toDTOList(List<SalesOrderMaterial> entityList) {
        return entityList != null
                ? entityList.stream().map(this::toDTO).collect(Collectors.toList())
                : null;
    }

    // Ánh xạ từ SalesOrderMaterialDTO (DTO) → SalesOrderMaterial (Entity)
    @Mapping(target = "material", expression = "java(fetchMaterial(dto.getMaterialId(), materialRepository))")
    @Mapping(source = "requiredQuantity", target = "requiredQuantity")
    @Mapping(source = "receivedQuantity", target = "receivedQuantity")

    SalesOrderMaterial toEntity(SalesOrderMaterialDTO dto, @Context MaterialsRepository materialRepository);

    default List<SalesOrderMaterial> toEntityList(List<SalesOrderMaterialDTO> dtoList, @Context MaterialsRepository materialRepository) {
        return dtoList != null
                ? dtoList.stream().map(dto -> toEntity(dto, materialRepository)).collect(Collectors.toList())
                : null;
    }

    default Material fetchMaterial(Long materialId, MaterialsRepository materialRepository) {
        if (materialId == null) {
            throw new IllegalArgumentException("Material ID không được null");
        }
        return materialRepository.findById(materialId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Material với ID: " + materialId));
    }
}