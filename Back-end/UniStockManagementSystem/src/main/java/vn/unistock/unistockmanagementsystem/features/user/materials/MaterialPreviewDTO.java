package vn.unistock.unistockmanagementsystem.features.user.materials;

import lombok.Data;

@Data
public class MaterialPreviewDTO {
    private int rowIndex;
    private String materialCode;
    private String materialName;
    private String unitName;
    private String materialTypeName;
    private String partnerName;
    private String description;

    private boolean valid;
    private String errorMessage;
}

