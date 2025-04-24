package vn.unistock.unistockmanagementsystem.features.user.purchaseRequests;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.unistock.unistockmanagementsystem.entities.PurchaseRequest;

import java.util.List;
import java.util.Optional;

public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, Long> {
    @Query("SELECT MAX(pr.purchaseRequestId) FROM PurchaseRequest pr")
    Long findMaxPurchaseRequestId();

    boolean existsBySalesOrder_OrderId(Long orderId);

    @Query("SELECT pr FROM PurchaseRequest pr LEFT JOIN FETCH pr.purchaseRequestDetails WHERE pr.purchaseRequestId = :id")
    Optional<PurchaseRequest> findByIdWithDetails(@Param("id") Long id);

    List<PurchaseRequest> findAllBySalesOrder_OrderId(Long orderId);

}