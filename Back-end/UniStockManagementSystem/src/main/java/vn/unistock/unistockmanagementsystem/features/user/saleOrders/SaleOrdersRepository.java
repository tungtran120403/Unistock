package vn.unistock.unistockmanagementsystem.features.user.saleOrders;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.unistock.unistockmanagementsystem.entities.SalesOrder;

import java.util.List;
import java.util.Optional;

public interface SaleOrdersRepository extends JpaRepository<SalesOrder, Long> {

    @Query("SELECT COALESCE(MAX(s.orderId), 0) FROM SalesOrder s")
    Long findMaxOrderId();

}