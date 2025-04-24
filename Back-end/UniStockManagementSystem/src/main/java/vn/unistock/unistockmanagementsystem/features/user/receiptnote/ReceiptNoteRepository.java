package vn.unistock.unistockmanagementsystem.features.user.receiptnote;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.unistock.unistockmanagementsystem.entities.GoodReceiptNote;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReceiptNoteRepository extends JpaRepository<GoodReceiptNote, Long> {
    @Query("SELECT MAX(grn.grnId) FROM GoodReceiptNote grn")
    Long findMaxGoodReceiptNoteId();

    @Query("SELECT grn FROM GoodReceiptNote grn " +
            "WHERE (:search IS NULL OR grn.grnCode LIKE %:search% OR grn.description LIKE %:search%) " +
            "AND (:categories IS NULL OR grn.category IN :categories) " +
            "AND (:start IS NULL OR grn.receiptDate >= :start) " +
            "AND (:end IS NULL OR grn.receiptDate <= :end)")
    Page<GoodReceiptNote> findByFilters(
            @Param("search") String search,
            @Param("categories") List<String> categories,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable
    );
}
