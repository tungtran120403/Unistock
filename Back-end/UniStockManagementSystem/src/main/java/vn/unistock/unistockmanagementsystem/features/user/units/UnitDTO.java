package vn.unistock.unistockmanagementsystem.features.user.units;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnitDTO {
    private Long unitId;
    private String unitName;
    private Boolean status;
}
