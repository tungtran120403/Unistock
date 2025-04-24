package vn.unistock.unistockmanagementsystem.features.profile;

import lombok.Data;

@Data
public class ChangePasswordDTO {
    private String currentPassword;
    private String newPassword;
}