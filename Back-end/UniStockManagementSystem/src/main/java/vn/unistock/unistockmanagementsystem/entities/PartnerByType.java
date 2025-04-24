package vn.unistock.unistockmanagementsystem.entities;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "partner_by_type")
public class PartnerByType {
    @EmbeddedId
    private PartnerByTypeKey id;

    @ManyToOne
    @MapsId("partnerId")  // Map với cột partner_id
    @JoinColumn(name = "partner_id")
    private Partner partner;

    @ManyToOne
    @MapsId("typeId")  // Map với cột partner_type_id
    @JoinColumn(name = "partner_type_id")
    private PartnerType partnerType;

    @Column(name = "partner_code", unique = true, nullable = false)
    private String partnerCode;
}
