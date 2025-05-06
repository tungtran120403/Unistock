package vn.unistock.unistockmanagementsystem.features.user.issueNote;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueNoteDTO {
    private Long ginId;
    private String ginCode;
    private String description;
    private String category;
    private Long partnerId;
    private String partnerName;
    private String address;
    private String contactName;
    private String phone;
    private LocalDateTime issueDate;
    private Long soId;
    private String soCode;
    private Long createdBy;
    private String createdByUserName;
    private String receiver;
    private List<IssueNoteDetailDTO> details;
    private List<IssueNoteDetailDTO> expectedReturns;
    private List<String> paperEvidence;
    private ReceiveOutsourceDTO receiveOutsource;
}