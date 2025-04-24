package vn.unistock.unistockmanagementsystem.security.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.unistock.unistockmanagementsystem.entities.Permission;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class DynamicAuthorizationFilter extends OncePerRequestFilter {

    private final AntPathMatcher antPathMatcher = new AntPathMatcher();

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // 1) Lấy thông tin Authentication từ SecurityContext
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (request.getRequestURI().equals("/api/unistock/auth/me")
                || request.getRequestURI().equals("/api/unistock/profile")
                || request.getRequestURI().equals("/api/unistock/profile/change-password")
                || request.getRequestURI().equals("/api/unistock/profile/avatar")) {
            filterChain.doFilter(request, response);
            return;
        }


        // Nếu chưa đăng nhập hoặc anonymous => cho qua
        if (authentication == null || !authentication.isAuthenticated()) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2) Principal phải là CustomUserDetails
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof CustomUserDetails userDetails)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3) Lấy method + URI
        String method = request.getMethod();        // GET, POST, ...
        String uri = request.getRequestURI();       // /api/xxx

        // In ra console để debug
        System.out.println("=== DynamicAuthorizationFilter: Checking permission for "
                + method + " " + uri + " ===");

        // 4) Kiểm tra xem user có Permission khớp (method, uri) không
        boolean isAllowed = checkPermission(userDetails, method, uri);

        if (!isAllowed) {
            // 403 Forbidden
            System.out.println(">>> No matching permission => 403 Forbidden");
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden");
            return;
        }

        // 5) Nếu đủ quyền => cho request đi tiếp
        filterChain.doFilter(request, response);
    }

    private boolean checkPermission(CustomUserDetails userDetails, String method, String uri) {
        // Lấy danh sách Permission của user
        for (Permission p : userDetails.getAllPermissions()) {

            // Log permission đang so sánh
            System.out.println("  Checking Permission: "
                    + p.getHttpMethod() + " " + p.getUrlPattern());

            // So khớp method
            if (p.getHttpMethod().equalsIgnoreCase(method)
                    || p.getHttpMethod().equalsIgnoreCase("ALL")) {

                // So khớp urlPattern
                boolean matched = antPathMatcher.match(p.getUrlPattern(), uri);

                System.out.println("    antPathMatcher.match(\""
                        + p.getUrlPattern() + "\", \"" + uri + "\") => " + matched);

                if (matched) {
                    System.out.println("    => FOUND matching permission, allow");
                    return true; // Tìm thấy permission khớp => cho qua
                }
            }
        }
        return false; // Không tìm thấy permission phù hợp
    }
}