package vn.unistock.unistockmanagementsystem.features.user.issueNote;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.unistock.unistockmanagementsystem.entities.ReceiveOutsource;
import vn.unistock.unistockmanagementsystem.entities.ReceiveOutsourceMaterial;

@Mapper(componentModel = "spring")
public interface ReceiveOutsourceMapper {

    @Mapping(source = "goodIssueNote.ginId", target = "ginId")
    @Mapping(source = "partner.partnerId", target = "partnerId")
    @Mapping(source = "partner.partnerName", target = "partnerName")
    @Mapping(source = "materials", target = "materials")
    @Mapping(source = "goodIssueNote.ginCode", target = "ginCode")
    @Mapping(source = "partner.phone", target = "partnerPhone")
    @Mapping(source = "partner.address", target = "partnerAddress")
    @Mapping(source = "partner.contactName", target = "partnerContactName")
    ReceiveOutsourceDTO toDTO(ReceiveOutsource entity);

    @Mapping(source = "material.materialId", target = "materialId")
    @Mapping(source = "material.materialCode", target = "materialCode")
    @Mapping(source = "material.materialName", target = "materialName")
    @Mapping(source = "unit.unitId", target = "unitId")
    @Mapping(source = "unit.unitName", target = "unitName")
    @Mapping(target = "warehouseId", ignore = true) // Bỏ qua vì warehouse không được set
    @Mapping(target = "warehouseName", ignore = true) // Bỏ qua vì warehouse không được set
    ReceiveOutsourceMaterialDTO toDTO(ReceiveOutsourceMaterial entity);
}
