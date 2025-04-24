package vn.unistock.unistockmanagementsystem.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Data
@Entity
@Table(name = "permissions")
@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "permission_id")
    private Long permissionId;


    private String httpMethod;   // GET, POST, PUT, DELETE, ...
    private String urlPattern;

    @Column(name = "permission_name")
    private String permissionName;

    private String description;



    // Liên kết qua bảng nối role_permissions
    @OneToMany(mappedBy = "permission", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    private List<RolePermission> rolePermissions;
}
