package vn.unistock.unistockmanagementsystem.features.user.receiptnote;

import lombok.*;
import vn.unistock.unistockmanagementsystem.entities.Unit;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceiptNoteDTO {
    private Long grnId;
    private String grnCode;
    private String description;
    private LocalDateTime receiptDate;
    private Long createdBy;
    private Long poId;
    private String category;
    private Long partnerId;
    private String partnerName;
    private String address;
    private String contactName;
    private String phone;
    private List<ReceiptNoteDetailDTO> details;
    private List<String> paperEvidence;
    private String createdByUsername;
    private String createdByEmail;
    private String poCode;
    private String ginCode;
    private Long ginId;
}
