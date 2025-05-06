package vn.unistock.unistockmanagementsystem.features.user.notification;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.unistock.unistockmanagementsystem.entities.Notification;


@Mapper(componentModel = "spring")
public interface NotificationMapper {
    @Mapping(source = "material.materialId", target = "materialId")
    @Mapping(source = "material.materialName", target = "materialName")
    NotificationDTO toDTO(Notification notification);

    Notification toEntity(NotificationDTO notificationDTO);
}
