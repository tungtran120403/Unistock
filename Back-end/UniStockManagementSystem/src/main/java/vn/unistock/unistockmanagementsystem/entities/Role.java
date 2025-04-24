package vn.unistock.unistockmanagementsystem.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "role_id")
    private Long roleId;

    @Column(name = "role_name")
    private String roleName;

    private String description;
    private Boolean isActive;


    // 🟢 Bảng nối role_permissions (vẫn giữ nguyên nếu cần)
    @OneToMany(mappedBy = "role", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    private List<RolePermission> rolePermissions = new ArrayList<>();

    // 🟢 (Tuỳ chọn) Thêm phần ManyToMany “ngược” để lấy danh sách users
    @ManyToMany(mappedBy = "roles", fetch = FetchType.LAZY)
    @ToString.Exclude
    private Set<User> users = new HashSet<>();
}
