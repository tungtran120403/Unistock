package vn.unistock.unistockmanagementsystem.features.user.purchaseRequests;

import lombok.Data;

@Data
public class UpdateStatusRequestDTO {
    private String status;
    private String rejectionReason;
}