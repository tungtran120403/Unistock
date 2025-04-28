package vn.unistock.unistockmanagementsystem.features.admin.permission;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/unistock/admin/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    // 🟢 API: Lấy danh sách quyền
    @GetMapping
    public ResponseEntity<List<PermissionDTO>> getAllPermissions() {
        return ResponseEntity.ok(permissionService.getAllPermissions());
    }

//    // 🟢 API: Thêm quyền mới
//    @PostMapping
//    public ResponseEntity<PermissionDTO> createPermission(@RequestBody PermissionDTO dto) {
//        PermissionDTO newPermission = permissionService.createPermission(dto);
//        return ResponseEntity.status(HttpStatus.CREATED).body(newPermission);
//    }
//
//    // 🟢 API: Cập nhật thông tin quyền
//    @PutMapping("/{id}")
//    public ResponseEntity<PermissionDTO> updatePermission(@PathVariable Long id, @RequestBody PermissionDTO dto) {
//        PermissionDTO updatedPermission = permissionService.updatePermission(id, dto);
//        return ResponseEntity.ok(updatedPermission);
//    }
//
//    // 🗑 API: Xóa quyền
//    @DeleteMapping("/{id}")
//    public ResponseEntity<Void> deletePermission(@PathVariable Long id) {
//        permissionService.deletePermission(id);
//        return ResponseEntity.noContent().build();
//    }
}
