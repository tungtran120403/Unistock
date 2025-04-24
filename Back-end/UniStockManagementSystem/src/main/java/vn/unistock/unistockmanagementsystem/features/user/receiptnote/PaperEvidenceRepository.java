package vn.unistock.unistockmanagementsystem.features.user.receiptnote;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.unistock.unistockmanagementsystem.entities.PaperEvidence;

import java.util.List;

public interface PaperEvidenceRepository extends JpaRepository<PaperEvidence, Long> {
    List<PaperEvidence> findByNoteIdAndNoteType(Long noteId, PaperEvidence.NoteType noteType);

}
