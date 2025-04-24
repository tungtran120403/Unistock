package vn.unistock.unistockmanagementsystem.entities;

import jakarta.persistence.*;
import lombok.*;


@Entity
@Table(name = "material_partner")
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MaterialPartner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id", nullable = false)
    private Partner partner;

}