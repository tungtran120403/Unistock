package vn.unistock.unistockmanagementsystem.features.admin.role;

import jakarta.persistence.Entity;
import lombok.*;

import java.util.List;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RoleDTO {
    private Long id;
    private String name;
    private String description;
    private Boolean active;
    private List<String> permissionKeys;
}
