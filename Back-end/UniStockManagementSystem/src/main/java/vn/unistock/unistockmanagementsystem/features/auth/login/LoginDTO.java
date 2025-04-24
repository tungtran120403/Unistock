package vn.unistock.unistockmanagementsystem.features.auth.login;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class LoginDTO {
    private String email;
    private String password;
    private List<String> roles;
    private String token;

    public LoginDTO(String token, List<String> roles, String email) {
        this.token = token;
        this.roles = roles;
        this.email = email;
    }
}
