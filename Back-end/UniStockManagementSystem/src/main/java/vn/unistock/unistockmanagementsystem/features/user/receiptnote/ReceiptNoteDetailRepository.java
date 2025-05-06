package vn.unistock.unistockmanagementsystem.features.user.receiptnote;

import jakarta.annotation.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vn.unistock.unistockmanagementsystem.entities.GoodReceiptDetail;
import vn.unistock.unistockmanagementsystem.entities.GoodReceiptNote;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReceiptNoteDetailRepository extends JpaRepository<GoodReceiptDetail, Long> {
    @Query("""
SELECT new vn.unistock.unistockmanagementsystem.features.user.receiptnote.ReceiptNoteDetailViewDTO(
    d.grnDetailsId,
    n.grnId,
    w.warehouseId,
    w.warehouseCode,
    w.warehouseName,
    m.materialId,
    m.materialCode,
    m.materialName,
    p.productId,
    p.productCode,
    p.productName,
    d.quantity,
    u.unitId,
    u.unitName,
    null, null,
    n.grnCode,
    n.category,
    n.receiptDate,
    CASE
        WHEN m IS NOT NULL AND p IS NULL THEN 'MATERIAL'
        WHEN p IS NOT NULL AND m IS NULL THEN 'PRODUCT'
        ELSE 'UNKNOWN'
    END
)
FROM GoodReceiptDetail d
JOIN d.goodReceiptNote n
JOIN d.warehouse w
LEFT JOIN d.material m
LEFT JOIN d.product p
LEFT JOIN d.unit u
WHERE
    (:search IS NULL OR 
        LOWER(n.grnCode) LIKE LOWER(CONCAT('%', :search, '%')) OR 
        LOWER(m.materialCode) LIKE LOWER(CONCAT('%', :search, '%')) OR 
        LOWER(m.materialName) LIKE LOWER(CONCAT('%', :search, '%')) OR 
        LOWER(p.productCode) LIKE LOWER(CONCAT('%', :search, '%')) OR 
        LOWER(p.productName) LIKE LOWER(CONCAT('%', :search, '%'))
    )
    AND (:startDate IS NULL OR n.receiptDate >= :startDate)
    AND (:endDate IS NULL OR n.receiptDate <= :endDate)
    AND (:itemType IS NULL OR
        (:itemType = 'MATERIAL' AND m.materialId IS NOT NULL) OR
        (:itemType = 'PRODUCT' AND p.productId IS NOT NULL)
    )
    AND (:minQuantity IS NULL OR d.quantity >= :minQuantity)
    AND (:maxQuantity IS NULL OR d.quantity <= :maxQuantity)
    AND (COALESCE(:categories, NULL) IS NULL OR n.category IN :categories)
    AND (COALESCE(:warehouseIds, NULL) IS NULL OR w.warehouseId IN :warehouseIds)
ORDER BY n.receiptDate DESC
""")

    Page<ReceiptNoteDetailViewDTO> getFilteredImportReport(
            @Nullable String search,
            @Nullable LocalDateTime startDate,
            @Nullable LocalDateTime endDate,
            @Nullable String itemType,
            @Nullable Double minQuantity,
            @Nullable Double maxQuantity,
            @Nullable List<String> categories,
            @Nullable List<Long> warehouseIds,
            Pageable pageable
    );

}
