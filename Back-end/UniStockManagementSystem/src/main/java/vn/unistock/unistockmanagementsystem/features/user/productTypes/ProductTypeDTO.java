package vn.unistock.unistockmanagementsystem.features.user.productTypes;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductTypeDTO {
    private Long typeId;
    private String typeName;
    private String description;
    private Boolean status;
}