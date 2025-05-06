package vn.unistock.unistockmanagementsystem.features.user.issueNote;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vn.unistock.unistockmanagementsystem.entities.GoodIssueDetail;

import java.util.List;

@Repository
public interface IssueNoteDetailRepository extends JpaRepository<GoodIssueDetail, Long> {
    @Query("""
SELECT new vn.unistock.unistockmanagementsystem.features.user.issueNote.IssueNoteReportDTO(
    n.ginCode,
    n.category,
    n.issueDate,
    w.warehouseName,
    m.materialCode,
    m.materialName,
    p.productCode,
    p.productName,
    u.unitName,
    d.quantity
)
FROM GoodIssueDetail d
JOIN d.goodIssueNote n
JOIN d.warehouse w
LEFT JOIN d.material m
LEFT JOIN d.product p
LEFT JOIN d.unit u
WHERE
    (:search IS NULL OR 
        LOWER(n.ginCode) LIKE LOWER(CONCAT('%', :search, '%')) OR 
        LOWER(m.materialCode) LIKE LOWER(CONCAT('%', :search, '%')) OR 
        LOWER(m.materialName) LIKE LOWER(CONCAT('%', :search, '%')) OR 
        LOWER(p.productCode) LIKE LOWER(CONCAT('%', :search, '%')) OR 
        LOWER(p.productName) LIKE LOWER(CONCAT('%', :search, '%'))
    )
    AND (:startDate IS NULL OR n.issueDate >= :startDate)
    AND (:endDate IS NULL OR n.issueDate <= :endDate)
    AND (:itemType IS NULL OR 
        (:itemType = 'MATERIAL' AND m.materialId IS NOT NULL) OR 
        (:itemType = 'PRODUCT' AND p.productId IS NOT NULL)
    )
    AND (:minQuantity IS NULL OR d.quantity >= :minQuantity)
    AND (:maxQuantity IS NULL OR d.quantity <= :maxQuantity)
    AND (COALESCE(:categories, NULL) IS NULL OR n.category IN :categories)
    AND (COALESCE(:warehouseIds, NULL) IS NULL OR w.warehouseId IN :warehouseIds)
ORDER BY n.issueDate DESC
""")
    Page<IssueNoteReportDTO> getFilteredExportReport(
            @org.springframework.lang.Nullable String search,
            @org.springframework.lang.Nullable java.time.LocalDateTime startDate,
            @org.springframework.lang.Nullable java.time.LocalDateTime endDate,
            @org.springframework.lang.Nullable String itemType,
            @org.springframework.lang.Nullable Double minQuantity,
            @org.springframework.lang.Nullable Double maxQuantity,
            @org.springframework.lang.Nullable List<String> categories,
            @org.springframework.lang.Nullable List<Long> warehouseIds,
            Pageable pageable
    );
}