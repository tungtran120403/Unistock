package vn.unistock.unistockmanagementsystem.features.user.products;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.unistock.unistockmanagementsystem.entities.Product;

import java.util.List;
import java.util.Optional;


@Repository
public interface ProductsRepository extends JpaRepository<Product, Long> {
    boolean existsByProductCode(String productCode);
    boolean existsByProductCodeAndProductIdNot(String productCode, Long productId);
    Page<Product> findAll(Pageable pageable);
    Optional<Product> findByProductCode(String productCode);
    Page<Product> findByIsProductionActiveTrue(Pageable pageable);
    @Query("SELECT p FROM Product p WHERE :search IS NULL OR p.productCode LIKE %:search% OR p.productName LIKE %:search%")
    List<Product> findByCodeOrName(@Param("search") String search);

}
