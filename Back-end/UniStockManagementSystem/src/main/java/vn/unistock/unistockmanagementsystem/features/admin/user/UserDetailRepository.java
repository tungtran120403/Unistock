package vn.unistock.unistockmanagementsystem.features.admin.user;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.unistock.unistockmanagementsystem.entities.UserDetail;

    public interface UserDetailRepository extends JpaRepository<UserDetail, Long> {
}
