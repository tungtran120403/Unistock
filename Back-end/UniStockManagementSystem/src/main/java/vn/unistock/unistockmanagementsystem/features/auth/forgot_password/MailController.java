package vn.unistock.unistockmanagementsystem.features.auth.forgot_password;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.unistock.unistockmanagementsystem.entities.User;
import vn.unistock.unistockmanagementsystem.features.admin.user.UserRepository;
import vn.unistock.unistockmanagementsystem.security.Jwt;

import java.util.Map;

@RestController
@RequestMapping("/api/unistock/auth")
@RequiredArgsConstructor
public class MailController {
    private final MailService mailService;
    private final OtpService otpService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EphemeralService ephemeralService;

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody EmailDTO request) {
        String email = request.getToEmail();
        // Kiểm tra user có tồn tại
        User user = userRepository.findByEmail(email);
        if (user == null) {
            return ResponseEntity.badRequest().body("Địa chỉ email này chưa được đăng kí");
        }
        // Sinh OTP 6 chữ số, hiệu lực 5 phút
        String otp = otpService.generateAndSaveOtp(email, 5);

        // Soạn nội dung email
        String subject = "OTP for Password Reset";
        String htmlBody = "<html><body>"
                + "<h3>Your OTP code is: " + otp + "</h3>"
                + "<p>It is valid for 5 minutes.</p>"
                + "</body></html>";

        // Gửi email
        mailService.send(email, subject, htmlBody);

        return ResponseEntity.ok("OTP sent successfully to " + email);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String inputOtp = payload.get("otp");

        if (email == null || inputOtp == null) {
            return ResponseEntity.badRequest().body("Missing fields");
        }

        boolean isValid = otpService.validateOtp(email, inputOtp);
        if (!isValid) {
            return ResponseEntity.badRequest().body("Invalid or expired OTP");
        }

        // 1. Tạo ephemeral token
        String ephemeralToken = java.util.UUID.randomUUID().toString().replace("-", "");
        // 2. Lưu vào EphemeralService
        ephemeralService.storeEphemeralToken(email, ephemeralToken);

        // 3. Trả token về cho FE
        // FE sẽ gọi /reset-password kèm { email, ephemeralToken, newPassword }
        return ResponseEntity.ok(Map.of("ephemeralToken", ephemeralToken));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String ephemeralToken = payload.get("ephemeralToken");
        String newPassword = payload.get("newPassword");

        if (email == null || ephemeralToken == null || newPassword == null) {
            return ResponseEntity.badRequest().body("Missing fields");
        }

        // Kiểm tra ephemeral token
        boolean validToken = ephemeralService.validateEphemeralToken(email, ephemeralToken);
        if (!validToken) {
            return ResponseEntity.badRequest().body("Invalid or expired token");
        }

        // Tìm user
        User user = userRepository.findByEmail(email);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        // Đặt mật khẩu mới
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Xoá token sau khi dùng
        ephemeralService.removeEphemeralToken(email);

        return ResponseEntity.ok("Password reset successfully!");
    }

}
