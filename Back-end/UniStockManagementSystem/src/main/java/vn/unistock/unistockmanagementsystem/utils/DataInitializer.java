//
//package vn.unistock.unistockmanagementsystem.utils;
//
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.stereotype.Component;
//import org.springframework.transaction.annotation.Transactional;
//import vn.unistock.unistockmanagementsystem.entities.Permission;
//import vn.unistock.unistockmanagementsystem.entities.Role;
//import vn.unistock.unistockmanagementsystem.entities.RolePermission;
//import vn.unistock.unistockmanagementsystem.features.admin.permission.PermissionRepository;
//import vn.unistock.unistockmanagementsystem.features.admin.role.RoleRepository;
//
//import java.util.Iterator;
//import java.util.List;
//import java.util.Optional;
//
//@Component
//public class DataInitializer implements CommandLineRunner {
//
//    private final RoleRepository roleRepository;
//    private final PermissionRepository permissionRepository;
//
//    public DataInitializer(RoleRepository roleRepository, PermissionRepository permissionRepository) {
//        this.roleRepository = roleRepository;
//        this.permissionRepository = permissionRepository;
//    }
//
//    @Override
//    @Transactional
//    public void run(String... args) {
//        System.out.println("🚀 [INIT] Kiểm tra Role & Permission...");
//
//        // 🟢 **Tạo Role ADMIN nếu chưa tồn tại**
//        Role adminRole = roleRepository.findByRoleName("ADMIN")
//                .orElseGet(() -> {
//                    Role role = new Role();
//                    role.setRoleName("ADMIN");
//                    role.setDescription("Quản trị viên hệ thống");
//                    role.setIsActive(true);
//                    return roleRepository.save(role); // ✅ Lưu ngay để tránh lỗi Hibernate
//                });
//
//        // 🟢 **Tạo Role USER nếu chưa tồn tại**
//        Role userRole =  roleRepository.findByRoleName("USER")
//                .orElseGet(() -> {
//                    Role role = new Role();
//                    role.setRoleName("USER");
//                    role.setDescription("Người dùng thông thường");
//                    role.setIsActive(true);
//                    return roleRepository.save(role);
//                });
//
//        // 🟢 **Lấy tất cả permission có API bắt đầu bằng `/api/unistock/admin/`**
//        List<Permission> adminPermissions = permissionRepository.findByUrlPatternStartingWith("/api/unistock/admin/");
//
//        if (!adminPermissions.isEmpty()) {
//            System.out.println("🔹 Tổng số permission dành cho ADMIN: " + adminPermissions.size());
//
//            // ✅ **Xóa từng phần tử trong danh sách (tránh mất tham chiếu)**
//            Iterator<RolePermission> iterator = adminRole.getRolePermissions().iterator();
//            while (iterator.hasNext()) {
//                iterator.next();
//                iterator.remove();
//            }
//
//            // ✅ **Thêm quyền mới vào danh sách hiện tại**
//            for (Permission permission : adminPermissions) {
//                adminRole.getRolePermissions().add(new RolePermission(null, adminRole, permission));
//            }
//
//            // ✅ **Lưu lại role**
//            roleRepository.save(adminRole);
//
//            System.out.println("✅ Đã gán tất cả permission admin cho role ADMIN!");
//        } else {
//            System.out.println("⚠️ Không có permission nào cho role ADMIN!");
//        }
//
//        System.out.println("🚀 [INIT] Hoàn tất!");
//
//        if (userRole != null) {
//            // Lấy tất cả permission bắt đầu bằng /api/unistock/user/
//            List<Permission> userPermissions = permissionRepository.findByUrlPatternStartingWith("/api/unistock/user/");
//            if (!userPermissions.isEmpty()) {
//                System.out.println("🔹 Tổng số permission dành cho USER: " + userPermissions.size());
//
//                // Xoá tất cả role-permission cũ của USER
//                Iterator<RolePermission> userIterator = userRole.getRolePermissions().iterator();
//                while (userIterator.hasNext()) {
//                    userIterator.next();
//                    userIterator.remove();
//                }
//
//                // Thêm quyền mới cho USER
//                for (Permission permission : userPermissions) {
//                    userRole.getRolePermissions().add(new RolePermission(null, userRole, permission));
//                }
//
//                // Lưu lại role
//                roleRepository.save(userRole);
//                System.out.println("✅ Đã gán tất cả permission user cho role USER!");
//            } else {
//                System.out.println("⚠️ Không có permission nào cho role USER!");
//            }
//        }
//
//        System.out.println("🚀 [INIT] Hoàn tất!");
//    }
//
//}
//
