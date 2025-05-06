package vn.unistock.unistockmanagementsystem.features.user.materialType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.unistock.unistockmanagementsystem.entities.MaterialType;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialTypeRepository extends JpaRepository<MaterialType, Long> {
    boolean existsByNameAndMaterialTypeIdNot(String name, Long materialTypeId);
    List<MaterialType> findAllByStatusTrue(); // Đổi từ findAllByUsingTrue
    Optional<MaterialType> findByNameIgnoreCase(String name);
    Optional<MaterialType> findByName(String name);
    Page<MaterialType> findAll(Pageable pageable);
    boolean existsByNameIgnoreCase(String name);
    @Query("""
    SELECT m FROM MaterialType m
    WHERE (:search IS NULL OR LOWER(m.name) LIKE LOWER(CONCAT('%', :search, '%')))
      AND (:status IS NULL OR m.status = :status)
""")
    Page<MaterialType> searchMaterialTypes(
            @Param("search") String search,
            @Param("status") Boolean status,
            Pageable pageable
    );

}