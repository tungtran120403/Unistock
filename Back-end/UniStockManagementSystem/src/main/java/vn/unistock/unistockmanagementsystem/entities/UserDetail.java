package vn.unistock.unistockmanagementsystem.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "user_details")
public class UserDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "detail_id")
    private Long detailId;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "user_id", nullable = false, unique = true)
    private User user;

    private String fullname;
    private String address;
    private String phoneNumber;
    private LocalDate dateOfBirth;
    private String profilePicture; // Lưu đường dẫn ảnh đại diện
}
