package vn.unistock.unistockmanagementsystem.features.auth.forgot_password;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private final Map<String, Otp> otpStorage = new ConcurrentHashMap<>();

    // Sinh OTP 6 chữ số, lưu với thời hạn (validMinutes)
    public String generateAndSaveOtp(String email, int validMinutes) {
        int otpInt = (int) (Math.random() * 900000) + 100000;
        String otpCode = String.valueOf(otpInt);

        Otp otp = new Otp(otpCode, validMinutes); // class Otp { code, expirationTime, isExpired()... }
        otpStorage.put(email, otp);
        return otpCode;
    }

    // Kiểm tra OTP
    public boolean validateOtp(String email, String inputOtp) {
        Otp otp = otpStorage.get(email);
        if (otp == null) {
            return false;
        }
        if (otp.isExpired()) {
            otpStorage.remove(email);
            return false;
        }
        if (otp.getCode().equals(inputOtp)) {
            // Xác thực xong thì xóa
            otpStorage.remove(email);
            return true;
        }
        return false;
    }
}
