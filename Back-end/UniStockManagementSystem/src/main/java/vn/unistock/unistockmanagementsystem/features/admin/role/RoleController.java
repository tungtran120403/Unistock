package vn.unistock.unistockmanagementsystem.features.admin.role;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.unistock.unistockmanagementsystem.entities.Permission;
import vn.unistock.unistockmanagementsystem.entities.Role;
import vn.unistock.unistockmanagementsystem.features.admin.permission.PermissionDTO;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/unistock/admin/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    // 🟢 API: Lấy danh sách vai trò
    @GetMapping
    public ResponseEntity<List<RoleDTO>> getAllRoles() {
        return ResponseEntity.ok(roleService.getAllRoles());
    }

    // 🟢 API: Thêm mới vai trò
    @PostMapping
    public ResponseEntity<RoleDTO> createRole(@RequestBody RoleDTO dto) {
        RoleDTO newRole = roleService.createRole(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(newRole);
    }

    // 🟢 API: Cập nhật thông tin vai trò
    @PutMapping("/{id}")
    public ResponseEntity<RoleDTO> updateRole(@PathVariable Long id, @RequestBody RoleDTO dto) {
        RoleDTO updatedRole = roleService.updateRole(id, dto);
        return ResponseEntity.ok(updatedRole);
    }

    // 🔄 API: Cập nhật trạng thái active của vai trò
    @PatchMapping("/{id}/status")
    public ResponseEntity<RoleDTO> updateRoleStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> status) {
        RoleDTO updatedRole = roleService.updateRoleStatus(id, status.get("active"));
        return ResponseEntity.ok(updatedRole);
    }

    // 🗑 API: Xóa vai trò
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/permissions")
    public ResponseEntity<?> getRolePermissions(@PathVariable Long id) {
        Role role = roleService.getRoleById(id);
        if (role == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Vai trò không tồn tại");
        }

        List<PermissionDTO> permissions = role.getRolePermissions().stream()
                .map(rp -> {
                    Permission perm = rp.getPermission(); // Lấy Permission từ RolePermission
                    return PermissionDTO.builder()
                            .id(perm.getPermissionId())      // ID của Permission
                            .name(perm.getPermissionName())  // Tên Permission
                            .description(perm.getDescription()) // Mô tả Permission
                            .httpMethod(perm.getHttpMethod())  // HTTP Method
                            .urlPattern(perm.getUrlPattern())  // URL Pattern
                            .build();
                })
                .collect(Collectors.toList());



        return ResponseEntity.ok(Map.of(
                "roleId", role.getRoleId(),
                "roleName", role.getRoleName(),
                "permissions", permissions
        ));
    }

}
