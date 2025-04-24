package vn.unistock.unistockmanagementsystem.features.admin.user;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDetailDTO {
    private String fullname;
    private String phoneNumber;
    private String address;
    private LocalDate dateOfBirth;
    private String profilePicture; // ✅ Lưu đường dẫn ảnh đại diện
}
