package vn.unistock.unistockmanagementsystem.features.profile;

import lombok.Data;

import java.time.LocalDate;
import java.util.Set;
import java.util.stream.Collectors;

@Data
public class UserProfileDTO {
    private Long userId;
    private String email;
    private String username;
    private Boolean isActive;
    private String fullname;
    private String address;
    private String phoneNumber;
    private LocalDate dateOfBirth;
    private String profilePicture;
    private Set<String> roles;
}