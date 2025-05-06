package vn.unistock.unistockmanagementsystem.features.admin.role;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import vn.unistock.unistockmanagementsystem.entities.Permission;
import vn.unistock.unistockmanagementsystem.entities.Role;
import vn.unistock.unistockmanagementsystem.entities.RolePermission;
import vn.unistock.unistockmanagementsystem.features.admin.permission.PermissionHierarchy;
import vn.unistock.unistockmanagementsystem.features.admin.permission.PermissionRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RoleService {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private RoleMapper roleMapper;
    @Autowired
    private PermissionRepository permissionRepository;

    public List<RoleDTO> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(roleMapper::toDTO)
                .collect(Collectors.toList());
    }
    @CacheEvict(value = "users", allEntries = true)
    public RoleDTO createRole(RoleDTO dto) {
        if (roleRepository.existsByRoleName(dto.getName())) {
            throw new IllegalArgumentException("DUPLICATE_ROLE");
        }
        Role entity = roleMapper.toEntity(dto);

        // Xử lý permissionKeys từ DTO để khởi tạo rolePermissions
        if (dto.getPermissionKeys() != null && !dto.getPermissionKeys().isEmpty()) {
            // Mở rộng sub-permissions
            Set<String> expandedKeys = PermissionHierarchy.expandPermissions(dto.getPermissionKeys());

            // Tìm Permissions trong DB
            List<Permission> foundPermissions = permissionRepository.findByPermissionNameIn(expandedKeys);

            // Khởi tạo rolePermissions nếu null
            if (entity.getRolePermissions() == null) {
                entity.setRolePermissions(new ArrayList<>());
            }

            // Thêm RolePermission
            for (Permission p : foundPermissions) {
                RolePermission rp = RolePermission.builder()
                        .role(entity)
                        .permission(p)
                        .build();
                entity.getRolePermissions().add(rp);
            }
        } else {
            // Nếu không có permissionKeys, khởi tạo rolePermissions rỗng
            if (entity.getRolePermissions() == null) {
                entity.setRolePermissions(new ArrayList<>());
            }
        }

        entity = roleRepository.save(entity);
        return roleMapper.toDTO(entity);
    }


    public RoleDTO updateRoleStatus(Long id, boolean isActive) {
        Role existingRole = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vai trò"));

        existingRole.setIsActive(isActive);
        existingRole = roleRepository.save(existingRole);
        return roleMapper.toDTO(existingRole);
    }
    @CacheEvict(value = "users", allEntries = true)
    public RoleDTO updateRole(Long id, RoleDTO dto) {
        Role existingRole = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vai trò"));

        // ✅ Check trùng tên với vai trò khác
        if (roleRepository.existsByRoleName(dto.getName()) &&
                !existingRole.getRoleName().equals(dto.getName())) {
            throw new IllegalArgumentException("DUPLICATE_ROLE");
        }

        existingRole.setRoleName(dto.getName());
        existingRole.setDescription(dto.getDescription());
        existingRole.setIsActive(dto.getActive());

        // (1)
        if (dto.getPermissionKeys() != null) {
            // (2) Mở rộng sub-permissions
            Set<String> expandedKeys = PermissionHierarchy.expandPermissions(dto.getPermissionKeys());

            // (3) Tìm các Permission trong DB theo permissionName
            List<Permission> foundPermissions = permissionRepository
                    .findByPermissionNameIn((expandedKeys));

            // (4) Clear cũ
            existingRole.getRolePermissions().clear();

            // (5) Thêm RolePermission mới
            for (Permission p : foundPermissions) {
                RolePermission rp = RolePermission.builder()
                        .role(existingRole)
                        .permission(p)
                        .build();
                existingRole.getRolePermissions().add(rp);
            }
        }

        // Lưu lại
        existingRole = roleRepository.save(existingRole);
        return roleMapper.toDTO(existingRole);
    }


    public void deleteRole(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vai trò không tồn tại"));

        roleRepository.delete(role);
    }

    public Role getRoleById(Long id) {
        return roleRepository.findById(id).orElse(null);
    }

}
