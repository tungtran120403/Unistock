package vn.unistock.unistockmanagementsystem.features.user.productTypes;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.unistock.unistockmanagementsystem.entities.ProductType;

import java.util.List;
import java.util.Optional;

public interface ProductTypeRepository extends JpaRepository<ProductType, Long> {
    boolean existsByTypeNameIgnoreCase(String typeName);
    Optional<ProductType> findByTypeName(String typeName);
    List<ProductType> findAllByStatusTrue();
    Optional<ProductType> findByTypeNameIgnoreCase(String typeName);
    boolean existsByTypeNameIgnoreCaseAndTypeIdNot(String typeName, Long typeId);
}
