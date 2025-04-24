package vn.unistock.unistockmanagementsystem.features.user.purchaseOrder;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.unistock.unistockmanagementsystem.entities.PurchaseOrderDetail;

import java.util.List;

public interface PurchaseOrderDetailRepository extends JpaRepository<PurchaseOrderDetail, Long> {
    @Query("SELECT pod FROM PurchaseOrderDetail pod JOIN FETCH pod.material m LEFT JOIN FETCH m.unit WHERE pod.purchaseOrder.poId = :poId")
    List<PurchaseOrderDetail> findByPurchaseOrderPoId(@Param("poId") Long poId);
}

