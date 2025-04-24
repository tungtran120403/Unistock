package vn.unistock.unistockmanagementsystem.features.user.products;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.unistock.unistockmanagementsystem.entities.Product;

import java.util.Optional;


@Repository
public interface ProductsRepository extends JpaRepository<Product, Long> {
    boolean existsByProductCode(String productCode);
    boolean existsByProductCodeAndProductIdNot(String productCode, Long productId);
    Page<Product> findAll(Pageable pageable);
    Optional<Product> findByProductCode(String productCode);
    Page<Product> findByIsProductionActiveTrue(Pageable pageable);
}
