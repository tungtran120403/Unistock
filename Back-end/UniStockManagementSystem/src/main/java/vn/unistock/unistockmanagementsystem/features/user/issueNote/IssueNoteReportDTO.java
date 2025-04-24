package vn.unistock.unistockmanagementsystem.features.user.issueNote;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueNoteReportDTO {
    private String ginCode;
    private String category;
    private LocalDateTime issueDate;

    private String warehouseName;
    private String materialCode;
    private String materialName;
    private String productCode;
    private String productName;
    private String unitName;
    private Double quantity;
}
