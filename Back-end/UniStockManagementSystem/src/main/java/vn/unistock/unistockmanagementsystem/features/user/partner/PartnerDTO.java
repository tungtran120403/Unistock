package vn.unistock.unistockmanagementsystem.features.user.partner;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import vn.unistock.unistockmanagementsystem.features.user.partner.partnerByType.PartnerByTypeDTO;

import java.util.List;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerDTO {
    private Long partnerId;
    @NotBlank(message = "Tên đối tác không được để trống.")
    private String partnerName;
    private String contactName;
    private String address;
    @Size(min = 10, max = 11, message = "Số điện thoại phải từ 10 đến 11 ký tự.")
    private String phone;
    @Email(message = "Email không hợp lệ.")
    private String email;
    private Set<PartnerByTypeDTO> partnerTypes;
    private List<String> partnerCodes;
}
