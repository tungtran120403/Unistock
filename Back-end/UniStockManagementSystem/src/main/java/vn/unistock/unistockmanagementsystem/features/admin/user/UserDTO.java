package vn.unistock.unistockmanagementsystem.features.admin.user;

import lombok.*;

import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private Long userId;
    private String username;
    private String email;
    private String password;
    private Boolean isActive;
    private Set<Long> roleIds;    // ✅ Danh sách ID của roles
    private Set<String> roleNames; // ✅ Danh sách tên của roles
    private UserDetailDTO userDetail; // ✅ Tách riêng thông tin cá nhân
}
