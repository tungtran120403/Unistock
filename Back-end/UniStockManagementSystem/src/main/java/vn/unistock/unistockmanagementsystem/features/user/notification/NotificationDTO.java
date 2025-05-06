package vn.unistock.unistockmanagementsystem.features.user.notification;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationDTO {
    private Long notificationId;
    private String message;
    private String type;
    private Boolean isRead;
    private Long materialId;
    private String materialName;
    private LocalDateTime createdAt;
}
