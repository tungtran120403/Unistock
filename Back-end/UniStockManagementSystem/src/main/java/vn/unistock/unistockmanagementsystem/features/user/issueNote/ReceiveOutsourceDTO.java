package vn.unistock.unistockmanagementsystem.features.user.issueNote;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceiveOutsourceDTO {
    private Long outsourceId;
    private Long ginId;
    private String ginCode;
    private Long partnerId;
    private String partnerName;
    private String partnerPhone;
    private String partnerAddress;
    private String partnerContactName;
    private String status;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
    private List<ReceiveOutsourceMaterialDTO> materials;
}
