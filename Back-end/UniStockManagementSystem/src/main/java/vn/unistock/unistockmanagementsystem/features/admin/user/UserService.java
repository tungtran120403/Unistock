package vn.unistock.unistockmanagementsystem.features.admin.user;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import vn.unistock.unistockmanagementsystem.entities.Role;
import vn.unistock.unistockmanagementsystem.entities.User;
import vn.unistock.unistockmanagementsystem.entities.UserDetail;
import vn.unistock.unistockmanagementsystem.features.admin.role.RoleRepository;
import vn.unistock.unistockmanagementsystem.features.auth.login.LoginService;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserDetailRepository userDetailRepository;
    private final LoginService loginService;
    private final UserMapper userMapper = UserMapper.INSTANCE;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserDTO createUser(UserDTO userDTO) {
        // 1) Kiểm tra email đã tồn tại chưa
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email đã tồn tại!");
        }

        // 2) Chuyển DTO -> Entity
        User user = userMapper.toEntity(userDTO);

        // 3) Mã hóa mật khẩu trước khi lưu
        if (userDTO.getPassword() != null && !userDTO.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDTO.getPassword())); // ✅ Mã hóa mật khẩu
        }

        // 4) **Lấy role `USER` (Nếu chưa có thì tạo mới)**
        Role userRole = roleRepository.findByRoleName("USER")
                .orElseGet(() -> {
                    Role newUserRole = new Role();
                    newUserRole.setRoleName("USER");
                    newUserRole.setDescription("Vai trò mặc định cho tất cả user");
                    newUserRole.setIsActive(true);
                    return roleRepository.save(newUserRole);
                });

        // 5) Kiểm tra Role hợp lệ trước khi lưu
        Set<Role> userRoles = new HashSet<>();

        if (userDTO.getRoleIds() != null && !userDTO.getRoleIds().isEmpty()) {
            List<Role> roles = roleRepository.findAllById(userDTO.getRoleIds());
            if (roles.isEmpty()) {
                throw new IllegalArgumentException("Danh sách role không hợp lệ!");
            }
            userRoles.addAll(roles);
        }

        // 🟢 **Gán role `USER` mặc định nếu chưa có role nào**
        userRoles.add(userRole);
        user.setRoles(userRoles);

        // 6) Lưu User
        user = userRepository.save(user);

        // 7) **Tạo UserDetail**
        UserDetail userDetail = new UserDetail();
        userDetail.setUser(user);
        if (userDTO.getUserDetail() != null) {
            userDetail.setFullname(userDTO.getUserDetail().getFullname());
            userDetail.setPhoneNumber(userDTO.getUserDetail().getPhoneNumber());
            userDetail.setAddress(userDTO.getUserDetail().getAddress());
            userDetail.setDateOfBirth(userDTO.getUserDetail().getDateOfBirth());
            userDetail.setProfilePicture(userDTO.getUserDetail().getProfilePicture());
        }
        userDetailRepository.save(userDetail);

        // 8) Trả lại DTO (Không trả về mật khẩu)
        UserDTO responseDTO = userMapper.toDTO(user);
        responseDTO.setPassword(null); // ✅ Không trả về password
        return responseDTO;
    }


    public UserDTO updateUser(Long userId, UserDTO updatedUserDTO) {
        // 1️⃣ Kiểm tra User có tồn tại không
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại!"));

        // 2️⃣ Cập nhật email nếu có thay đổi
        if (updatedUserDTO.getEmail() != null && !updatedUserDTO.getEmail().isEmpty()) {
            user.setEmail(updatedUserDTO.getEmail());
        }

        // 3️⃣ Cập nhật mật khẩu nếu có thay đổi
        if (updatedUserDTO.getPassword() != null && !updatedUserDTO.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(updatedUserDTO.getPassword()));
        }

        // 4️⃣ Cập nhật trạng thái kích hoạt (isActive)
        user.setIsActive(updatedUserDTO.getIsActive());

        // 5️⃣ Cập nhật `UserDetail` nếu có
        Optional<UserDetail> optionalUserDetail = Optional.ofNullable(user.getUserDetail());

        if (updatedUserDTO.getRoleIds() != null && !updatedUserDTO.getRoleIds().isEmpty()) {
            List<Role> roles = roleRepository.findAllById(updatedUserDTO.getRoleIds());
            if (roles.isEmpty()) {
                throw new IllegalArgumentException("Danh sách role không hợp lệ!");
            }
            user.setRoles(new HashSet<>(roles));
        }

        if (updatedUserDTO.getUserDetail() != null) {
            UserDetail userDetail = optionalUserDetail.orElseGet(UserDetail::new);
            userDetail.setUser(user); // Gán user

            // Cập nhật thông tin chi tiết
            userDetail.setFullname(updatedUserDTO.getUserDetail().getFullname());
            userDetail.setPhoneNumber(updatedUserDTO.getUserDetail().getPhoneNumber());
            userDetail.setAddress(updatedUserDTO.getUserDetail().getAddress());
            userDetail.setDateOfBirth(updatedUserDTO.getUserDetail().getDateOfBirth());

            userDetailRepository.save(userDetail); // Lưu thông tin UserDetail
        }

        // 6️⃣ Lưu user sau khi cập nhật
        user = userRepository.save(user);

        // 7️⃣ Trả về DTO (ẩn mật khẩu)
        UserDTO responseDTO = userMapper.toDTO(user);
        responseDTO.setPassword(null);
        return responseDTO;
    }

    // 🟢 Lấy danh sách Users
    public Page<UserDTO> getAllUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> userPage = userRepository.findAll(pageable);
        return userPage.map(userMapper::toDTO);
    }

    public UserDTO updateUserStatus(Long id, Boolean isActive) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại"));

        user.setIsActive(isActive);
        userRepository.save(user);

        loginService.evictUserCache(user.getEmail());
        return userMapper.toDTO(user);
    }

    // 🟢 Lấy User theo ID
    public UserDTO getUserByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại"));

        UserDTO userDTO = userMapper.toDTO(user);

        // ✅ Gán UserDetail vào DTO nếu có
        UserDetail userDetail = user.getUserDetail();
        if (userDetail != null) {
            userDTO.setUserDetail(userMapper.toUserDetailDTO(userDetail));
        }

        return userDTO;
    }
    public boolean checkEmailExists(String email) {
        System.out.println("📢 Kiểm tra email tồn tại trong DB: " + email);

        boolean exists = userRepository.existsByEmail(email); // 🟢 Sử dụng IgnoreCase

        System.out.println("📢 Kết quả tìm kiếm email: " + email + " - " + exists);
        return exists;
    }




    // 🟢 Xóa User theo ID
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
