package vn.unistock.unistockmanagementsystem.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "paper_evidence")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaperEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long noteId;

    @Enumerated(EnumType.STRING)
    private NoteType noteType;

    @Column(name = "paper_url", length = 255, nullable = false)
    private String paperUrl;

    public enum NoteType {
        GOOD_RECEIPT_NOTE, GOOD_ISSUE_NOTE
    }

}

