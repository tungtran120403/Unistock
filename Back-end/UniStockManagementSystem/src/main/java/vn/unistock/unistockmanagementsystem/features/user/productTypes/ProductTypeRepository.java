package vn.unistock.unistockmanagementsystem.features.user.productTypes;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.unistock.unistockmanagementsystem.entities.ProductType;

import java.util.List;
import java.util.Optional;

public interface ProductTypeRepository extends JpaRepository<ProductType, Long> {
    boolean existsByTypeNameIgnoreCase(String typeName);
    Optional<ProductType> findByTypeName(String typeName);
    List<ProductType> findAllByStatusTrue();
    Optional<ProductType> findByTypeNameIgnoreCase(String typeName);
    boolean existsByTypeNameIgnoreCaseAndTypeIdNot(String typeName, Long typeId);
    @Query("""
    SELECT p FROM ProductType p
    WHERE (:search IS NULL OR LOWER(p.typeName) LIKE LOWER(CONCAT('%', :search, '%')))
      AND (:status IS NULL OR p.status = :status)
""")
    Page<ProductType> searchProductTypes(@Param("search") String search,
                                         @Param("status") Boolean status,
                                         Pageable pageable);

}
