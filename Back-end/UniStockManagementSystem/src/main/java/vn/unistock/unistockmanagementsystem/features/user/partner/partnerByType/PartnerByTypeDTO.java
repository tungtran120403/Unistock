package vn.unistock.unistockmanagementsystem.features.user.partner.partnerByType;

import lombok.*;
import vn.unistock.unistockmanagementsystem.features.user.partnerType.PartnerTypeDTO;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerByTypeDTO {
    private PartnerTypeDTO partnerType;
    private String partnerCode;
}
