package vn.unistock.unistockmanagementsystem.features.admin.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.unistock.unistockmanagementsystem.entities.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);
    User findByUsername(String username);

    User findByEmail(String email);
}
