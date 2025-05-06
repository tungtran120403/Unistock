package vn.unistock.unistockmanagementsystem.features.user.saleOrders;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.unistock.unistockmanagementsystem.entities.SalesOrderMaterial;

import java.util.List;
import java.util.Optional;

public interface SalesOrderMaterialRepository extends JpaRepository<SalesOrderMaterial, Long> {
    Optional<SalesOrderMaterial> findBySalesOrderOrderIdAndMaterialMaterialId(Long orderId, Long materialId);
    List<SalesOrderMaterial> findBySalesOrderOrderId(Long orderId);
    void deleteBySalesOrderOrderId(Long orderId);
}