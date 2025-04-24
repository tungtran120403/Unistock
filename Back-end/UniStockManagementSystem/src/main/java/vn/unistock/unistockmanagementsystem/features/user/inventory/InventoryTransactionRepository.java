package vn.unistock.unistockmanagementsystem.features.user.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.unistock.unistockmanagementsystem.entities.InventoryTransaction;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    @Query("""
    SELECT new map(
        t.product.productId as productId,
        t.material.materialId as materialId,
        t.transactionType as type,
        SUM(t.quantity) as total
    )
    FROM InventoryTransaction t
    WHERE (:startDate IS NULL OR t.transactionDate >= :startDate)
      AND (:endDate IS NULL OR t.transactionDate <= :endDate)
      AND (t.product IS NOT NULL OR t.material IS NOT NULL)
    GROUP BY t.transactionType, t.product.productId, t.material.materialId
""")
    List<Map<String, Object>> summarizeTransactions(@Param("startDate") LocalDateTime startDate,
                                                    @Param("endDate") LocalDateTime endDate);

    @Query("""
    SELECT new map(
        t.product.productId as productId,
        t.material.materialId as materialId,
        t.transactionType as type,
        SUM(t.quantity) as total
    )
    FROM InventoryTransaction t
    WHERE t.transactionDate < :startDate
      AND (t.product IS NOT NULL OR t.material IS NOT NULL)
    GROUP BY t.transactionType, t.product.productId, t.material.materialId
""")
    List<Map<String, Object>> summarizeBefore(@Param("startDate") LocalDateTime startDate);

}
