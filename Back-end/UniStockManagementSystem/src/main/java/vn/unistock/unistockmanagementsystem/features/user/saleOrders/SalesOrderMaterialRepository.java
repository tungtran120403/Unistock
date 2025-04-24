package vn.unistock.unistockmanagementsystem.features.user.saleOrders;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.unistock.unistockmanagementsystem.entities.SalesOrderMaterial;

public interface SalesOrderMaterialRepository extends JpaRepository<SalesOrderMaterial, Long> {
}