package vn.unistock.unistockmanagementsystem.features.user.products;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import vn.unistock.unistockmanagementsystem.entities.ProductMaterial;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductMaterialsRepository extends JpaRepository<ProductMaterial, Long> {
    @Query("SELECT pm FROM ProductMaterial pm WHERE pm.product.id = :productId")
    Page<ProductMaterial> findByProduct_ProductId(@Param("productId") Long productId, Pageable pageable);

    @Query("SELECT pm FROM ProductMaterial pm WHERE pm.product.id = :productId AND pm.material.id = :materialId")
    Optional<ProductMaterial> findByProductIdAndMaterialId(@Param("productId") Long productId, @Param("materialId") Long materialId);

    @Transactional
    @Modifying
    @Query("DELETE FROM ProductMaterial pm WHERE pm.product.id = :productId AND pm.material.id = :materialId")
    void deleteByProductIdAndMaterialId(@Param("productId") Long productId, @Param("materialId") Long materialId);

    @Query("SELECT pm FROM ProductMaterial pm " +
            "JOIN pm.product p " +
            "JOIN SalesOrderDetail sod ON sod.product = p " +
            "WHERE sod.salesOrder.orderId = :saleOrderId")
    List<ProductMaterial> findBySaleOrderId(@Param("saleOrderId") Long saleOrderId);
}