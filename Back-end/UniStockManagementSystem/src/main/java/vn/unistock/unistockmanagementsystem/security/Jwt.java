package vn.unistock.unistockmanagementsystem.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.DecodingException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;

@Component
public class Jwt {

    @Value("${jwt.secret}")
    private String JWT_SECRET_KEY;

    private static final long JWT_EXPIRATION_TIME = 13600000; // 1 giờ (3600000 ms)

    /**
     * Tạo JWT token, với subject = email, và lưu userId, roles vào claim.
     */
    public String generateToken(Long userId, String email, List<String> roles) {
        return Jwts.builder()
                .setSubject("User Info")
                .claim("email", email)// Subject = email
                .claim("userId", userId) // Lưu userId trong claim
                .claim("roles", roles)   // Lưu danh sách roles
                .setIssuedAt(new Date()) // Thời điểm phát hành
                .setExpiration(new Date(System.currentTimeMillis() + JWT_EXPIRATION_TIME))
                .signWith(SignatureAlgorithm.HS256, JWT_SECRET_KEY)
                .compact();
    }

    /**
     * Giải mã token, trả về đối tượng Claims.
     * Ném IllegalArgumentException nếu token sai format.
     */
    public Claims extractClaims(String token) {
        try {
            return Jwts.parser()
                    .setSigningKey(JWT_SECRET_KEY)
                    .parseClaimsJws(token)
                    .getBody();
        } catch (DecodingException e) {
            throw new IllegalArgumentException("Invalid token format", e);
        }
    }

    /**
     * Lấy email từ token (được set làm subject).
     */
    public String extractEmail(String token) {
        Claims claims = extractClaims(token);
        return claims.get("email", String.class);
    }

    /**
     * Lấy userId từ token (lưu trong claim "userId").
     */
    public Long extractUserId(String token) {
        return extractClaims(token).get("userId", Long.class);
    }

    /**
     * Lấy roles từ token (lưu trong claim "roles").
     */
    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        return extractClaims(token).get("roles", List.class);
    }

    /**
     * Kiểm tra token đã hết hạn chưa.
     */
    public boolean isTokenExpired(String token) {
        return extractClaims(token).getExpiration().before(new Date());
    }

    /**
     * Kiểm tra token có hợp lệ không, bằng cách so khớp email với subject và token chưa hết hạn.
     */
    public boolean validateToken(String token, String email) {
        return email.equals(extractEmail(token)) && !isTokenExpired(token);
    }
}
