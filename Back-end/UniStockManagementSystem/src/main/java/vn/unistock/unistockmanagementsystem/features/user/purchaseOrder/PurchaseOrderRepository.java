package vn.unistock.unistockmanagementsystem.features.user.purchaseOrder;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.unistock.unistockmanagementsystem.entities.PurchaseOrder;
import vn.unistock.unistockmanagementsystem.entities.SalesOrder;

import java.util.List;
import java.util.Optional;
@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    @Query("SELECT p FROM PurchaseOrder p LEFT JOIN FETCH p.partner WHERE p.poId = :id")
    Optional<PurchaseOrder> findByIdWithPartner(@Param("id") Long id);

    // Thêm vào PurchaseOrderRepository
    @Query("SELECT p FROM PurchaseOrder p LEFT JOIN FETCH p.partner")
    Page<PurchaseOrder> findAllWithPartner(Pageable pageable);

    //find sale order by purchase order
    @Query("""
    SELECT so
    FROM PurchaseOrder po
    JOIN po.purchaseRequest pr
    JOIN pr.salesOrder so
    WHERE po.poId = :purchaseOrderId
""")
    Optional<SalesOrder> findSalesOrderByPurchaseOrderId(@Param("purchaseOrderId") Long purchaseOrderId);

    @Query("SELECT p FROM PurchaseOrder p WHERE p.status IN ('PENDING', 'IN_PROGRESS')")
    List<PurchaseOrder> findPendingOrInProgressOrders();

}
