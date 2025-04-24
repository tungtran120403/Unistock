package vn.unistock.unistockmanagementsystem.features.user.materialType;

import lombok.*;

@Getter
@Setter
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialTypeDTO {
    private Long materialTypeId;
    private String name;
    private String description;
    private boolean status;
}