package vn.unistock.unistockmanagementsystem.features.user.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.unistock.unistockmanagementsystem.entities.Notification;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByIsReadFalse();
    List<Notification> findByMaterialMaterialIdAndTypeAndIsReadFalse(Long materialId, Notification.NotificationType type);

}
