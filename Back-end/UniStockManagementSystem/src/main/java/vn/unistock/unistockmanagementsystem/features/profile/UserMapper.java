package vn.unistock.unistockmanagementsystem.features.profile;


import org.springframework.stereotype.Component;
import vn.unistock.unistockmanagementsystem.entities.User;

import java.util.stream.Collectors;

@Component
public class UserMapper {

    public UserProfileDTO toDTO(User user) {
        UserProfileDTO dto = new UserProfileDTO();
        dto.setUserId(user.getUserId());
        dto.setEmail(user.getEmail());
        dto.setUsername(user.getUsername());
        dto.setIsActive(user.getIsActive());
        dto.setRoles(user.getRoles().stream()
                .map(role -> role.getRoleName()) // Giả định Role có trường name
                .collect(Collectors.toSet()));

        if (user.getUserDetail() != null) {
            dto.setFullname(user.getUserDetail().getFullname());
            dto.setAddress(user.getUserDetail().getAddress());
            dto.setPhoneNumber(user.getUserDetail().getPhoneNumber());
            dto.setDateOfBirth(user.getUserDetail().getDateOfBirth());
            dto.setProfilePicture(user.getUserDetail().getProfilePicture());
        }
        return dto;
    }
}