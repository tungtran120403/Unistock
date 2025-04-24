package vn.unistock.unistockmanagementsystem.features.auth.forgot_password;

import java.time.LocalDateTime;

public class Otp {
    private String code;
    private LocalDateTime expirationTime;

    // Tạo OTP với mã code và số phút hợp lệ (validMinutes)
    public Otp(String code, int validMinutes) {
        this.code = code;
        this.expirationTime = LocalDateTime.now().plusMinutes(validMinutes);
    }

    public String getCode() {
        return code;
    }

    public LocalDateTime getExpirationTime() {
        return expirationTime;
    }

    // Kiểm tra OTP đã hết hạn hay chưa
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expirationTime);
    }
}
