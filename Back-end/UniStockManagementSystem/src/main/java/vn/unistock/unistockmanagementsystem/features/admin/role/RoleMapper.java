package vn.unistock.unistockmanagementsystem.features.admin.role;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.unistock.unistockmanagementsystem.entities.Role;

@Mapper(componentModel = "spring")
public interface RoleMapper {

    // Chuyển từ Entity -> DTO
    @Mapping(target = "id", source = "roleId")
    @Mapping(target = "name", source = "roleName")
    @Mapping(target = "description", source = "description")
    @Mapping(target = "active", source = "isActive")
    // Dùng expression để map rolePermissions -> List<String> permissionKeys
    @Mapping(
            target = "permissionKeys",
            expression = "java(entity.getRolePermissions().stream()"
                    + ".map(rp -> rp.getPermission().getPermissionName())"
                    + ".collect(java.util.stream.Collectors.toList()))"
    )
    RoleDTO toDTO(Role entity);

    // Chuyển từ DTO -> Entity
    @Mapping(target = "roleId", source = "id")
    @Mapping(target = "roleName", source = "name")
    @Mapping(target = "description", source = "description")
    @Mapping(target = "isActive", source = "active")
    @Mapping(target = "rolePermissions", ignore = true) // tránh lỗi vòng lặp
    @Mapping(target = "users", ignore = true)
    Role toEntity(RoleDTO dto);
}
