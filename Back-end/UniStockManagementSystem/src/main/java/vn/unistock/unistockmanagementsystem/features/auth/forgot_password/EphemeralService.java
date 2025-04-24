package vn.unistock.unistockmanagementsystem.features.auth.forgot_password;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EphemeralService {
    private final Map<String, String> ephemeralMap = new ConcurrentHashMap<>();

    // Lưu token tạm, gắn với email
    public void storeEphemeralToken(String email, String token) {
        ephemeralMap.put(email, token);
    }

    // Kiểm tra token
    public boolean validateEphemeralToken(String email, String token) {
        String storedToken = ephemeralMap.get(email);
        return token != null && token.equals(storedToken);
    }

    // Xoá token sau khi dùng xong
    public void removeEphemeralToken(String email) {
        ephemeralMap.remove(email);
    }
}
