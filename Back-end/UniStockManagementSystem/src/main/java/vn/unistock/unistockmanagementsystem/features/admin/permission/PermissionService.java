package vn.unistock.unistockmanagementsystem.features.admin.permission;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.unistock.unistockmanagementsystem.entities.Permission;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PermissionService {

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private PermissionMapper permissionMapper;

    // 🟢 Lấy danh sách tất cả quyền
    public List<PermissionDTO> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .filter(permission -> {
                    String url = permission.getUrlPattern().toLowerCase();
                    return !url.contains("admin") && !url.contains("auth") && !url.contains("error");
                })
                .map(permissionMapper::toDTO)
                .collect(Collectors.toList());
    }

    // 🟢 Thêm quyền mới
    public PermissionDTO createPermission(PermissionDTO dto) {
        if (permissionRepository.existsByPermissionName(dto.getName())) {
            throw new RuntimeException("Quyền đã tồn tại");
        }
        Permission entity = permissionMapper.toEntity(dto);
        entity = permissionRepository.save(entity);
        return permissionMapper.toDTO(entity);
    }

    // 🟢 Cập nhật quyền
    public PermissionDTO updatePermission(Long id, PermissionDTO dto) {
        Permission existingPermission = permissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy quyền"));

        existingPermission.setPermissionName(dto.getName());
        existingPermission.setDescription(dto.getDescription());
        existingPermission.setHttpMethod(dto.getHttpMethod());
        existingPermission.setUrlPattern(dto.getUrlPattern());

        existingPermission = permissionRepository.save(existingPermission);
        return permissionMapper.toDTO(existingPermission);
    }

    // 🗑 Xóa quyền
    public void deletePermission(Long id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quyền không tồn tại"));

        permissionRepository.delete(permission);
    }
}
