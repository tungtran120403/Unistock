package vn.unistock.unistockmanagementsystem.features.admin.permission;

import lombok.*;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PermissionDTO {
    private Long id;
    private String name;
    private String description;
    private String httpMethod;
    private String urlPattern;
}
