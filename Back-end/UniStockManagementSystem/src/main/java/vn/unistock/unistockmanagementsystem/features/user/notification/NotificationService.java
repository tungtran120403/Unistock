package vn.unistock.unistockmanagementsystem.features.user.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.unistock.unistockmanagementsystem.entities.Inventory;
import vn.unistock.unistockmanagementsystem.entities.Material;
import vn.unistock.unistockmanagementsystem.entities.Notification;
import vn.unistock.unistockmanagementsystem.features.user.inventory.InventoryRepository;
import vn.unistock.unistockmanagementsystem.features.user.materials.MaterialsRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final InventoryRepository inventoryRepository;
    private final MaterialsRepository materialRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;

    public void checkLowStock(Long materialId) {
        Double availableQuantity = inventoryRepository
                .findByMaterialIdAndStatus(materialId, Inventory.InventoryStatus.AVAILABLE)
                .stream()
                .mapToDouble(Inventory::getQuantity)
                .sum();

        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new IllegalArgumentException("Material not found"));

        if (material.getLowStockThreshold() != null && material.getLowStockThreshold() > 0) {
            if (availableQuantity <= material.getLowStockThreshold()) {
                List<Notification> existingNotifications = notificationRepository.findByMaterialMaterialIdAndTypeAndIsReadFalse(materialId, Notification.NotificationType.LOW_STOCK);

                if (existingNotifications.isEmpty()) {
                    Notification notification = Notification.builder()
                            .message(String.format("Vật tư %s (Mã: %s) có tồn kho thấp: %s/%s",
                                    material.getMaterialName(),
                                    material.getMaterialCode(),
                                    availableQuantity,
                                    material.getLowStockThreshold()))
                            .type(Notification.NotificationType.LOW_STOCK)
                            .material(material)
                            .isRead(false)
                            .createdAt(LocalDateTime.now())
                            .build();

                    notificationRepository.save(notification);
                }
                else {
                    // ✅ Đã có ➔ update message
                    Notification existing = existingNotifications.get(0);  // Lấy notification chưa đọc gần nhất
                    existing.setMessage(String.format("Vật tư %s (Mã: %s) có tồn kho thấp: %s/%s",
                            material.getMaterialName(),
                            material.getMaterialCode(),
                            availableQuantity,
                            material.getLowStockThreshold()));
                    existing.setCreatedAt(LocalDateTime.now());
                    notificationRepository.save(existing);
                }
            }
        }
    }

    public List<NotificationDTO> getUnreadNotifications() {
        return notificationRepository.findByIsReadFalse()
                .stream()
                .map(notificationMapper::toDTO)
                .collect(Collectors.toList());
    }

    public void markNotificationAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    public void clearLowStockNotificationIfRecovered(Long materialId) {
        Double availableQuantity = inventoryRepository
                .findByMaterialIdAndStatus(materialId, Inventory.InventoryStatus.AVAILABLE)
                .stream()
                .mapToDouble(Inventory::getQuantity)
                .sum();

        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new IllegalArgumentException("Material not found"));

        if (material.getLowStockThreshold() != null && availableQuantity >= material.getLowStockThreshold()) {
            List<Notification> lowStockNotifications = notificationRepository.findByMaterialMaterialIdAndTypeAndIsReadFalse(
                    materialId, Notification.NotificationType.LOW_STOCK
            );
            for (Notification notif : lowStockNotifications) {
                notif.setIsRead(true);
                notificationRepository.save(notif);
            }
        }
    }

}
