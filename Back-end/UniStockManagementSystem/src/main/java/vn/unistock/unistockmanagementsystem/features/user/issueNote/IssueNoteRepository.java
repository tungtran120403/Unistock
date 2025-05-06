package vn.unistock.unistockmanagementsystem.features.user.issueNote;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.unistock.unistockmanagementsystem.entities.GoodIssueNote;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IssueNoteRepository extends JpaRepository<GoodIssueNote, Long> {
    @Query("SELECT MAX(gin.ginId) FROM GoodIssueNote gin")
    Long findMaxIssueNoteId();

    @Query("""
    SELECT gin FROM GoodIssueNote gin
    WHERE 
      (:search IS NULL OR :search = '' 
          OR LOWER(gin.ginCode) LIKE LOWER(CONCAT('%', :search, '%'))
          OR LOWER(gin.description) LIKE LOWER(CONCAT('%', :search, '%'))
      )
      AND (:startDate IS NULL OR gin.issueDate >= :startDate)
      AND (:endDate IS NULL OR gin.issueDate <= :endDate)
      AND (:categories IS NULL OR gin.category IN :categories)
""")
    Page<GoodIssueNote> searchFilteredIssueNotes(
            @Param("search") String search,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("categories") List<String> categories,
            Pageable pageable
    );

}