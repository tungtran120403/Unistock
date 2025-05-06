package vn.unistock.unistockmanagementsystem.features.user.purchaseRequests;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.unistock.unistockmanagementsystem.entities.PurchaseRequest;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, Long> {
    @Query("SELECT MAX(pr.purchaseRequestId) FROM PurchaseRequest pr")
    Long findMaxPurchaseRequestId();

    boolean existsBySalesOrder_OrderId(Long orderId);

    @Query("SELECT pr FROM PurchaseRequest pr LEFT JOIN FETCH pr.purchaseRequestDetails WHERE pr.purchaseRequestId = :id")
    Optional<PurchaseRequest> findByIdWithDetails(@Param("id") Long id);

    List<PurchaseRequest> findAllBySalesOrder_OrderId(Long orderId);

    @Query("""
    SELECT pr FROM PurchaseRequest pr
    WHERE 
      (:search IS NULL OR :search = '' 
          OR LOWER(pr.purchaseRequestCode) LIKE LOWER(CONCAT('%', :search, '%'))
          OR LOWER(pr.notes) LIKE LOWER(CONCAT('%', :search, '%'))
      )
      AND (:startDate IS NULL OR FUNCTION('DATE', pr.createdDate) >= :startDate)
      AND (:endDate IS NULL OR FUNCTION('DATE', pr.createdDate) <= :endDate)
      AND (:statuses IS NULL OR pr.status IN :statuses)
""")
    Page<PurchaseRequest> searchFilteredPurchaseRequests(
            @Param("search") String search,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("statuses") List<PurchaseRequest.RequestStatus> statuses,
            Pageable pageable
    );

}