package vn.unistock.unistockmanagementsystem.features.user.materials;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import vn.unistock.unistockmanagementsystem.entities.Material;
import vn.unistock.unistockmanagementsystem.entities.MaterialPartner;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface MaterialsMapper {

    @Mapping(source = "unit.unitId", target = "unitId")
    @Mapping(source = "unit.unitName", target = "unitName")
    @Mapping(source = "materialType.materialTypeId", target = "typeId")
    @Mapping(source = "materialType.name", target = "typeName")
    @Mapping(source = "isUsing", target = "isUsing")
    @Mapping(source = "materialPartners", target = "supplierIds", qualifiedByName = "mapSuppliers")
    @Mapping(source = "lowStockThreshold", target = "lowStockThreshold")
    MaterialsDTO toDTO(Material material);

    @Named("mapSuppliers")
    default List<Long> mapSuppliers(List<MaterialPartner> materialPartners) {
        if (materialPartners == null) return new ArrayList<>();
        return materialPartners.stream()
                .map(mp -> mp.getPartner().getPartnerId())
                .collect(Collectors.toList());
    }
}

