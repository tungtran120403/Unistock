package vn.unistock.unistockmanagementsystem.features.user.issueNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vn.unistock.unistockmanagementsystem.entities.GoodIssueNote;

@Repository
public interface IssueNoteRepository extends JpaRepository<GoodIssueNote, Long> {
    @Query("SELECT MAX(gin.ginId) FROM GoodIssueNote gin")
    Long findMaxIssueNoteId();
}