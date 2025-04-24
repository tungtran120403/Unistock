package vn.unistock.unistockmanagementsystem.features.profile;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.unistock.unistockmanagementsystem.entities.User;
import vn.unistock.unistockmanagementsystem.entities.UserDetail;
import vn.unistock.unistockmanagementsystem.features.admin.user.UserRepository;
import vn.unistock.unistockmanagementsystem.features.auth.login.LoginService;
import vn.unistock.unistockmanagementsystem.utils.storage.AzureBlobService;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final LoginService loginService;
    private final AzureBlobService azureBlobService;

    // Lấy thông tin profile dựa trên email truyền vào
    public UserProfileDTO getProfile(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UsernameNotFoundException("User not found with email: " + email);
        }
        return userMapper.toDTO(user);
    }

    // Cập nhật profile
    public UserProfileDTO updateProfile(String email, UserProfileDTO dto) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UsernameNotFoundException("User not found with email: " + email);
        }

        // Cập nhật thông tin chi tiết của User
        UserDetail userDetail = user.getUserDetail();
        if (userDetail == null) {
            userDetail = new UserDetail();
            userDetail.setUser(user);
        }
        userDetail.setFullname(dto.getFullname());
        userDetail.setAddress(dto.getAddress());
        userDetail.setPhoneNumber(dto.getPhoneNumber());

        user.setUserDetail(userDetail);
        userRepository.save(user);
        return userMapper.toDTO(user);
    }

    // Đổi mật khẩu
    public void changePassword(String email, ChangePasswordDTO dto) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UsernameNotFoundException("User not found with email: " + email);
        }
        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không chính xác");
        }
        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);

        // Xóa cache của user sau khi cập nhật mật khẩu
        loginService.evictUserCache(email);
    }

    // Upload ảnh đại diện
    public String uploadAvatar(String email, MultipartFile file) throws IOException {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UsernameNotFoundException("User not found with email: " + email);
        }

        // Lấy thông tin ảnh cũ (nếu có)
        UserDetail userDetail = user.getUserDetail();
        String oldAvatarUrl = null;
        if (userDetail != null) {
            oldAvatarUrl = userDetail.getProfilePicture();
        }

        // Upload file lên Azure Blob Storage
        String uploadedUrl = azureBlobService.uploadFile(file);

        if (userDetail == null) {
            userDetail = new UserDetail();
            userDetail.setUser(user);
        }
        userDetail.setProfilePicture(uploadedUrl);
        user.setUserDetail(userDetail);
        userRepository.save(user);

        // Xóa ảnh cũ nếu có
        if (oldAvatarUrl != null && !oldAvatarUrl.isEmpty()) {
            azureBlobService.deleteFile(oldAvatarUrl);
        }

        return uploadedUrl;
    }
}
