package vn.unistock.unistockmanagementsystem.features.auth.forgot_password;

import lombok.*;

@Getter
@Setter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class EmailDTO {
    private String toEmail;
    private String subject;
    private String body;
}
