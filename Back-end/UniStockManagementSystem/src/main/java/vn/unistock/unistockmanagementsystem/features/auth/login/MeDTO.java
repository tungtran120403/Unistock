package vn.unistock.unistockmanagementsystem.features.auth.login;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class MeDTO {
    private Long userId;
    private String email;
    private String username;
    private List<String> roles;
    private List<String> permissions;
    private String avatar;
}
