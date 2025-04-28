package vn.unistock.unistockmanagementsystem.features.user.saleOrders;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.unistock.unistockmanagementsystem.entities.SalesOrder;

import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface SaleOrdersRepository extends JpaRepository<SalesOrder, Long> {

    @Query("SELECT COALESCE(MAX(s.orderId), 0) FROM SalesOrder s")
    Long findMaxOrderId();

    @Query("SELECT s FROM SalesOrder s " +
            "WHERE (:orderCode IS NULL OR LOWER(s.orderCode) LIKE LOWER(CONCAT('%', :orderCode, '%'))) " +
            "AND (:partnerName IS NULL OR LOWER(s.partner.partnerName) LIKE LOWER(CONCAT('%', :partnerName, '%'))) " +
            "AND (:statuses IS NULL OR s.status IN :statuses) " +
            "AND (:startDate IS NULL OR s.orderDate >= :startDate) " +
            "AND (:endDate IS NULL OR s.orderDate <= :endDate)")
    Page<SalesOrder> findByFilters(
            @Param("orderCode") String orderCode,
            @Param("partnerName") String partnerName,
            @Param("statuses") List<SalesOrder.OrderStatus> statuses,
            @Param("startDate") Date startDate,
            @Param("endDate") Date endDate,
            Pageable pageable);
}