package vn.unistock.unistockmanagementsystem.features.auth.login;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import vn.unistock.unistockmanagementsystem.entities.Permission;
import vn.unistock.unistockmanagementsystem.entities.Role;
import vn.unistock.unistockmanagementsystem.entities.User;
import vn.unistock.unistockmanagementsystem.security.Jwt;
import vn.unistock.unistockmanagementsystem.security.filter.CustomUserDetails;

import java.util.List;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/unistock/auth")
@RequiredArgsConstructor
public class LoginController {
    private final Jwt jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final LoginService loginService;


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDTO request) {
        try {
            User user = loginService.loadUserByEmail(request.getEmail());

            // Nếu user không tồn tại, trả về thông báo "Sai email hoặc mật khẩu!"
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Sai email hoặc mật khẩu!");
            }

            // Kiểm tra mật khẩu
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Sai email hoặc mật khẩu!");
            }

            // Kiểm tra trạng thái active của user; sử dụng Boolean.TRUE.equals để tránh NullPointerException
            if (user.getIsActive() == null || !user.getIsActive()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Tài khoản đã bị khóa!");
            }


            List<String> roles = user.getRoles().stream()
                    .map(Role::getRoleName)
                    .collect(Collectors.toList());

            String token = jwtUtil.generateToken(user.getUserId(), user.getEmail(), roles);

            return ResponseEntity.ok(new LoginDTO(token, roles, user.getEmail()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Lỗi: " + e.getMessage());
        }
    }


    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (!(auth.getPrincipal() instanceof CustomUserDetails userDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userDetails.getUser();

        List<String> roles = user.getRoles().stream()
                .map(Role::getRoleName)
                .collect(Collectors.toList());

        List<String> permissions = userDetails.getAllPermissions().stream()
                .map(Permission::getPermissionName)
                .collect(Collectors.toList());

        // Lấy avatar từ UserDetail (nếu có)
        String avatar = null;
        if (user.getUserDetail() != null) {
            avatar = user.getUserDetail().getProfilePicture();
        }

        // Tạo MeDTO với avatar
        MeDTO meDto = new MeDTO(
                user.getUserId(),
                user.getEmail(),
                user.getUsername(),
                roles,
                permissions,
                avatar
        );

        return ResponseEntity.ok(meDto);
    }


}
