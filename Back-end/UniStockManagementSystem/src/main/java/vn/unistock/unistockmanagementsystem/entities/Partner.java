package vn.unistock.unistockmanagementsystem.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Data
@Entity
@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "partners")
public class Partner {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "partner_id")
    private Long partnerId;

    @NotBlank(message = "Tên đối tác không được để trống.")
    @Column(name = "partner_name")
    private String partnerName;

    @OneToMany(mappedBy = "partner", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<PartnerByType> partnerTypes;

    @NotBlank(message = "Địa chỉ không được để trống.")
    private String address;

    private String contactName;

    @NotBlank(message = "Số điện thoại không được để trống.")
    @Size(min = 10, max = 11, message = "Số điện thoại phải từ 10 đến 11 ký tự.")
    private String phone;

    @Email(message = "Email không hợp lệ.")
    private String email;

    @OneToMany(mappedBy = "partner", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<MaterialPartner> materialPartners = new ArrayList<>();

    // Audit
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;
}