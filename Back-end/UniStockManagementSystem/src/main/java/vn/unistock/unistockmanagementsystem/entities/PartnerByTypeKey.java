package vn.unistock.unistockmanagementsystem.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Embeddable
public class PartnerByTypeKey implements Serializable {
    @Column(name = "partner_id")
    private Long partnerId;

    @Column(name = "partner_type_id")
    private Long typeId;
}
