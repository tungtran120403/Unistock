package vn.unistock.unistockmanagementsystem.entities;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "role_permissions")
public class RolePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rp_id")
    private Long id;

    // Quan hệ n-n, qua 2 many-to-one
    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;

    @ManyToOne
    @JoinColumn(name = "permission_id")
    private Permission permission;


}
