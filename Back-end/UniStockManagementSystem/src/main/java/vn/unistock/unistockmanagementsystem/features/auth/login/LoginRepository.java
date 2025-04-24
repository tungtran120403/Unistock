package vn.unistock.unistockmanagementsystem.features.auth.login;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.unistock.unistockmanagementsystem.entities.User;

import java.util.Optional;
@Repository
public interface LoginRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    @Query("""
      SELECT u FROM User u
        LEFT JOIN FETCH u.roles r
        LEFT JOIN FETCH r.rolePermissions rp
        LEFT JOIN FETCH rp.permission
      WHERE u.email = :email
    """)
    Optional<User> findByEmailFetchAll(@Param("email") String email);
}
