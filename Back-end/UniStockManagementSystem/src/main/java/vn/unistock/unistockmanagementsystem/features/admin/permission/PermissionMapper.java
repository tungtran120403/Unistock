package vn.unistock.unistockmanagementsystem.features.admin.permission;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.unistock.unistockmanagementsystem.entities.Permission;

@Mapper(componentModel = "spring")
public interface PermissionMapper {
    // Chuyển từ Entity -> DTO
    @Mapping(target = "id", source = "permissionId")
    @Mapping(target = "name", source = "permissionName")
    @Mapping(target = "description", source = "description")
    @Mapping(target = "httpMethod", source = "httpMethod")
    @Mapping(target = "urlPattern", source = "urlPattern")
    PermissionDTO toDTO(Permission entity);

    // Chuyển từ DTO -> Entity
    @Mapping(target = "permissionId", source = "id")
    @Mapping(target = "permissionName", source = "name")
    @Mapping(target = "description", source = "description")
    @Mapping(target = "httpMethod", source = "httpMethod")
    @Mapping(target = "urlPattern", source = "urlPattern")
    @Mapping(target = "rolePermissions", ignore = true) // Tránh lỗi vòng lặp
    Permission toEntity(PermissionDTO dto);
}
