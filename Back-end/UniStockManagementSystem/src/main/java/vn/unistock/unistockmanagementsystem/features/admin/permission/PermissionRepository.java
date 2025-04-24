package vn.unistock.unistockmanagementsystem.features.admin.permission;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.unistock.unistockmanagementsystem.entities.Permission;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface PermissionRepository extends JpaRepository<Permission, Long> {
    boolean existsByPermissionName(String permissionName);
    Optional<Permission> findByHttpMethodAndUrlPattern(String httpMethod, String urlPattern);
    List<Permission> findByUrlPatternStartingWith(String urlPattern);

    List<Permission> findByPermissionNameIn(Set<String> permissionNames);
}
