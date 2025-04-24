package vn.unistock.unistockmanagementsystem.security.scanner;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import vn.unistock.unistockmanagementsystem.entities.Permission;
import vn.unistock.unistockmanagementsystem.features.admin.permission.PermissionRepository;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class EndpointScanner implements ApplicationRunner {

    private final ApplicationContext applicationContext;
    private final PermissionRepository endpointRepository;

    @Override
    public void run(ApplicationArguments args) {
        // Lấy bean RequestMappingHandlerMapping từ context
        RequestMappingHandlerMapping handlerMapping = applicationContext.getBean(RequestMappingHandlerMapping.class);

        // Lấy toàn bộ map: RequestMappingInfo -> HandlerMethod
        Map<RequestMappingInfo, HandlerMethod> map = handlerMapping.getHandlerMethods();

        for (Map.Entry<RequestMappingInfo, HandlerMethod> entry : map.entrySet()) {
            RequestMappingInfo mappingInfo = entry.getKey();
            HandlerMethod handlerMethod = entry.getValue();

            // Lấy ra tập method (GET, POST, ...)
            Set<RequestMethod> methods = mappingInfo.getMethodsCondition().getMethods();

            // ----- Fallback lấy pattern từ cả 2 nơi (AntPathMatcher / PathPatternParser) -----
            Set<String> patterns = null;
            if (mappingInfo.getPatternsCondition() != null) {
                // AntPathMatcher
                patterns = mappingInfo.getPatternsCondition().getPatterns();
            } else if (mappingInfo.getPathPatternsCondition() != null) {
                // PathPatternParser (Spring Boot 3 / Spring 6)
                patterns = mappingInfo.getPathPatternsCondition().getPatternValues();
            }
            // ---------------------------------------------------------------------------------

            // Nếu lấy được patterns
            if (patterns != null) {
                for (String pattern : patterns) {
                    // Nếu methods trống, nghĩa là endpoint chấp nhận ALL method
                    if (methods.isEmpty()) {
                        saveOrUpdateEndpoint("ALL", pattern, handlerMethod);
                    } else {
                        // Nếu có nhiều method, lặp qua từng method
                        for (RequestMethod m : methods) {
                            saveOrUpdateEndpoint(m.name(), pattern, handlerMethod);
                        }
                    }
                }
            }
        }
    }

    private void saveOrUpdateEndpoint(String httpMethod, String pattern, HandlerMethod handlerMethod) {
        // Lấy tên method để làm permissionName (hoặc parse annotation nếu muốn)
        String permissionName = handlerMethod.getMethod().getName();

        // Kiểm tra xem đã tồn tại trong DB chưa (theo cặp httpMethod + urlPattern)
        Optional<Permission> existingOpt = endpointRepository.findByHttpMethodAndUrlPattern(httpMethod, pattern);

        if (existingOpt.isPresent()) {
            // Nếu đã có, cập nhật permissionName, ...
            Permission existing = existingOpt.get();
            existing.setPermissionName(permissionName);
            endpointRepository.save(existing);
        } else {
            // Nếu chưa có, tạo mới
            Permission newEndpoint = Permission.builder()
                    .httpMethod(httpMethod)
                    .urlPattern(pattern)
                    .permissionName(permissionName)
                    .description("Tự động scan")
                    .build();
            endpointRepository.save(newEndpoint);
        }
    }
}
