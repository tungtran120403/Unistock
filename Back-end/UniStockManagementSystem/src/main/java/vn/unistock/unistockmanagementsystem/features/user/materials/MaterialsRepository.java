package vn.unistock.unistockmanagementsystem.features.user.materials;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.unistock.unistockmanagementsystem.entities.Material;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialsRepository extends JpaRepository<Material, Long> {
    boolean existsByMaterialCode(String materialCode);
    boolean existsByMaterialCodeAndMaterialIdNot(String materialCode, Long materialId);
    Page<Material> findAll(Pageable pageable);

    @Query("SELECT m FROM Material m " +
            "LEFT JOIN FETCH m.materialPartners mp " +
            "LEFT JOIN FETCH mp.partner " +
            "WHERE m.materialId = :materialId")
    Optional<Material> findByIdWithPartners(@Param("materialId") Long materialId);

    @Query("SELECT m FROM Material m WHERE m.isUsing = true")
    List<Material> findAllByIsUsingTrue();

    @Query("SELECT m FROM Material m WHERE :search IS NULL OR m.materialCode LIKE %:search% OR m.materialName LIKE %:search%")
    List<Material> findByCodeOrName(@Param("search") String search);

}