package vn.unistock.unistockmanagementsystem.features.user.warehouse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.unistock.unistockmanagementsystem.entities.Warehouse;

import java.util.List;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
    boolean existsByWarehouseName(String warehouseName);
    Page<Warehouse> findAll(Pageable pageable);
    List<Warehouse> findAllByIsActive(Boolean isActive);
    boolean existsByWarehouseCode(String warehouseCode);
    boolean existsByWarehouseCodeAndWarehouseIdNot(String warehouseCode, Long warehouseId);

    Warehouse findByWarehouseId(Long warehouseId);

    @Query("SELECT w FROM Warehouse w WHERE " +
            "(:search IS NULL OR LOWER(w.warehouseCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(w.warehouseName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:isActive IS NULL OR w.isActive = :isActive)")
    Page<Warehouse> searchWarehouses(@Param("search") String search,
                                     @Param("isActive") Boolean isActive,
                                     Pageable pageable);

    List<Warehouse> findAllByWarehouseIdNot(Long warehouseId);

}
