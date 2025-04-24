package vn.unistock.unistockmanagementsystem.security.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.unistock.unistockmanagementsystem.entities.User;
import vn.unistock.unistockmanagementsystem.features.auth.login.LoginService;
import vn.unistock.unistockmanagementsystem.security.Jwt;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final Jwt jwtUtil;           // Class parse/generate token
    private final LoginService loginService; // Để load User từ DB

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // In ra để biết filter đã được gọi
        System.out.println("=== JwtAuthenticationFilter: doFilterInternal START ===");

        // 1) Lấy header Authorization
        String authHeader = request.getHeader("Authorization");
        System.out.println("JwtAuthenticationFilter: Authorization header = " + authHeader);

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7); // Bỏ "Bearer "
            System.out.println("JwtAuthenticationFilter: Extracted token = " + token);

            try {
                // 2) Giải mã token => lấy email, userId, roles
                String email = jwtUtil.extractEmail(token);
                Long userId = jwtUtil.extractUserId(token);
                List<String> roles = jwtUtil.extractRoles(token);

                System.out.println("JwtAuthenticationFilter: email=" + email
                        + ", userId=" + userId
                        + ", roles=" + roles);

                // (Tuỳ chọn) Kiểm tra token hợp lệ
                if (!jwtUtil.validateToken(token, email)) {
                    System.out.println("JwtAuthenticationFilter: Token invalid or expired => skip authentication");
                    filterChain.doFilter(request, response);
                    return;
                }

                // 3) Load user từ DB (bằng email)
                User user = loginService.loadUserByEmail(email);
                System.out.println("JwtAuthenticationFilter: Loaded user from DB = " + user);

                if (user != null) {
                    // 4) Tạo CustomUserDetails
                    CustomUserDetails userDetails = new CustomUserDetails(user);
                    System.out.println("JwtAuthenticationFilter: Created CustomUserDetails");

                    // 5) Tạo Authentication và set vào SecurityContext
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities()
                            );
                    SecurityContextHolder.getContext().setAuthentication(auth);

                    System.out.println("JwtAuthenticationFilter: Set authentication into SecurityContext");
                }
            } catch (Exception e) {
                // Token không hợp lệ => có thể log hoặc bỏ qua
                System.out.println("JwtAuthenticationFilter: Exception while parsing token => " + e.getMessage());
                // Ở đây ta cho qua, vẫn gọi filterChain.doFilter()
            }
        } else {
            System.out.println("JwtAuthenticationFilter: No Bearer token found => skip authentication");
        }

        // 6) Cho request đi tiếp
        System.out.println("=== JwtAuthenticationFilter: doFilterInternal END ===\n");
        filterChain.doFilter(request, response);
    }
}
