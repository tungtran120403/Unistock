package vn.unistock.unistockmanagementsystem.features.user.receiptnote;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vn.unistock.unistockmanagementsystem.entities.GoodReceiptDetail;
import vn.unistock.unistockmanagementsystem.entities.GoodReceiptNote;

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
        CASE\s
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
    ORDER BY n.receiptDate DESC
""")
    List<ReceiptNoteDetailViewDTO> getReceiptImportReportRaw();

    default Page<ReceiptNoteDetailViewDTO> getReceiptImportReport(Pageable pageable) {
        List<ReceiptNoteDetailViewDTO> all = getReceiptImportReportRaw();
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), all.size());
        return new PageImpl<>(all.subList(start, end), pageable, all.size());
    }
}
