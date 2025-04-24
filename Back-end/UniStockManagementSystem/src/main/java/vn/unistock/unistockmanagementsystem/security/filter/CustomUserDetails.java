package vn.unistock.unistockmanagementsystem.security.filter;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import vn.unistock.unistockmanagementsystem.entities.Permission;
import vn.unistock.unistockmanagementsystem.entities.Role;
import vn.unistock.unistockmanagementsystem.entities.RolePermission;
import vn.unistock.unistockmanagementsystem.entities.User;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class CustomUserDetails implements UserDetails {
    private final User user;
    private final Set<Permission> allPermissions = new HashSet<>();

    public CustomUserDetails(User user) {
        this.user = user;
        // Gộp tất cả permission từ các role
        for (Role r : user.getRoles()) {
            for (RolePermission rp : r.getRolePermissions()) {
                allPermissions.add(rp.getPermission());
            }
        }
    }

    public Set<Permission> getAllPermissions() {
        return allPermissions;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public String getPassword() {
        return "";
    }

    @Override
    public String getUsername() {
        return "";
    }
    public User getUser() {
        return this.user;
    }

}
