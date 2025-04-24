package vn.unistock.unistockmanagementsystem.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "units")
@AllArgsConstructor
@NoArgsConstructor
public class Unit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long unitId;

    @Column(name = "unit_name", unique = true, nullable = false)
    private String unitName;

    @Column(name = "status", nullable = false)
    private Boolean status = true;

}