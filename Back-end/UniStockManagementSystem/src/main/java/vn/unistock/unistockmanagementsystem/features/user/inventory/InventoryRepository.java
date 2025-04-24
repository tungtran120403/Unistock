package vn.unistock.unistockmanagementsystem.features.user.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.unistock.unistockmanagementsystem.entities.*;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {


    Optional<Inventory> findByWarehouseAndMaterialAndStatusAndSalesOrder(Warehouse warehouse, Material material, Inventory.InventoryStatus status, SalesOrder salesOrder);
    Optional<Inventory> findByWarehouseAndProductAndStatusAndSalesOrder(Warehouse warehouse, Product product, Inventory.InventoryStatus status, SalesOrder salesOrder);

    Optional<Inventory> findByWarehouseAndMaterialAndStatus(Warehouse warehouse, Material material, Inventory.InventoryStatus status);
    Optional<Inventory> findByWarehouseAndProductAndStatus(Warehouse warehouse, Product product, Inventory.InventoryStatus status);

    Optional<Inventory> findByMaterial_MaterialIdAndWarehouse_WarehouseIdAndStatusAndSalesOrder(Long materialId, Long warehouseId, Inventory.InventoryStatus status, SalesOrder salesOrder);
    Optional<Inventory> findByProduct_ProductIdAndWarehouse_WarehouseIdAndStatusAndSalesOrder(Long productId, Long warehouseId, Inventory.InventoryStatus status, SalesOrder salesOrder);

    @Query("""
    SELECT i 
    FROM Inventory i 
    WHERE (
          (:productId IS NOT NULL AND i.product IS NOT NULL AND i.product.productId = :productId)
          OR 
          (:materialId IS NOT NULL AND i.material IS NOT NULL AND i.material.materialId = :materialId)
          )
      AND i.quantity > 0
      AND i.status = vn.unistock.unistockmanagementsystem.entities.Inventory.InventoryStatus.AVAILABLE
      AND i.warehouse.warehouseId <> 3
""")
    List<InventoryByWarehouseDTO> findInventoryByAll(@Param("productId") Long productId,
                                       @Param("materialId") Long materialId);


    @Query("""
    SELECT COALESCE(SUM(i.quantity), 0)
    FROM Inventory i
    WHERE i.product.productId = :productId 
      AND i.status = vn.unistock.unistockmanagementsystem.entities.Inventory.InventoryStatus.AVAILABLE
    """)
    Double getTotalQuantityByProductId(@Param("productId") Long productId);

    @Query("""
    SELECT new vn.unistock.unistockmanagementsystem.features.user.inventory.InventoryByWarehouseDTO(
        i.warehouse.warehouseId,
        i.warehouse.warehouseName,
        SUM(i.quantity)
    )
    FROM Inventory i
    WHERE i.product.productId = :productId
      AND i.quantity > 0
      AND i.status = vn.unistock.unistockmanagementsystem.entities.Inventory.InventoryStatus.AVAILABLE
      AND i.warehouse.warehouseId <> 3
    GROUP BY i.warehouse.warehouseId, i.warehouse.warehouseName
    """)
    List<InventoryByWarehouseDTO> findInventoryByProductId(@Param("productId") Long productId);

    @Query("""
    SELECT new vn.unistock.unistockmanagementsystem.features.user.inventory.InventoryByWarehouseDTO(
        i.warehouse.warehouseId,
        i.warehouse.warehouseName,
        SUM(i.quantity)
    )
    FROM Inventory i
    WHERE i.material.materialId = :materialId
      AND i.quantity > 0
      AND i.status = vn.unistock.unistockmanagementsystem.entities.Inventory.InventoryStatus.AVAILABLE
      AND i.warehouse.warehouseId <> 3
    GROUP BY i.warehouse.warehouseId, i.warehouse.warehouseName
    """)
    List<InventoryByWarehouseDTO> findInventoryByMaterialId(@Param("materialId") Long materialId);


    @Query("""
    SELECT new vn.unistock.unistockmanagementsystem.features.user.inventory.InventoryByWarehouseDTO(
        i.warehouse.warehouseId,
        i.warehouse.warehouseName,
        SUM(i.quantity)
    )
    FROM Inventory i
    WHERE i.product.productId = :productId
      AND i.quantity > 0
      AND (i.status = vn.unistock.unistockmanagementsystem.entities.Inventory.InventoryStatus.AVAILABLE
           OR (i.status = vn.unistock.unistockmanagementsystem.entities.Inventory.InventoryStatus.RESERVED
               AND i.salesOrder.orderId = :salesOrderId))
      AND i.warehouse.warehouseId <> 3
    GROUP BY i.warehouse.warehouseId, i.warehouse.warehouseName
    """)
    List<InventoryByWarehouseDTO> findInventoryByProductIdWithSalesOrder(@Param("productId") Long productId, @Param("salesOrderId") Long salesOrderId);

    @Query("""
    SELECT new vn.unistock.unistockmanagementsystem.features.user.inventory.InventoryByWarehouseDTO(
        i.warehouse.warehouseId,
        i.warehouse.warehouseName,
        SUM(i.quantity)
    )
    FROM Inventory i
    WHERE i.material.materialId = :materialId
      AND i.quantity > 0
      AND (i.status = vn.unistock.unistockmanagementsystem.entities.Inventory.InventoryStatus.AVAILABLE
           OR (i.status = vn.unistock.unistockmanagementsystem.entities.Inventory.InventoryStatus.RESERVED
               AND i.salesOrder.orderId = :salesOrderId))
      AND i.warehouse.warehouseId <> 3
    GROUP BY i.warehouse.warehouseId, i.warehouse.warehouseName
    """)
    List<InventoryByWarehouseDTO> findInventoryByMaterialIdWithSalesOrder(@Param("materialId") Long materialId, @Param("salesOrderId") Long salesOrderId);


    @Query("""
    SELECT COALESCE(SUM(i.quantity), 0)
    FROM Inventory i
    WHERE i.material.materialId = :materialId 
      AND i.status = vn.unistock.unistockmanagementsystem.entities.Inventory.InventoryStatus.AVAILABLE
    """)
    Double getTotalQuantityByMaterialId(@Param("materialId") Long materialId);

    // Thêm các phương thức mới để lấy bản ghi Inventory theo trạng thái
    @Query("""
    SELECT i
    FROM Inventory i
    WHERE i.material.materialId = :materialId
      AND i.status = :status
      AND i.quantity > 0
    ORDER BY i.quantity DESC
    """)
    List<Inventory> findByMaterialIdAndStatus(@Param("materialId") Long materialId, @Param("status") Inventory.InventoryStatus status);

    @Query("""
    SELECT i
    FROM Inventory i
    WHERE i.product.productId = :productId
      AND i.status = :status
      AND i.quantity > 0
    ORDER BY i.quantity DESC
    """)
    List<Inventory> findByProductIdAndStatus(@Param("productId") Long productId, @Param("status") Inventory.InventoryStatus status);

    // Thêm phương thức để lấy tổng số lượng theo trạng thái
    @Query("""
    SELECT COALESCE(SUM(i.quantity), 0)
    FROM Inventory i
    WHERE i.material.materialId = :materialId 
      AND i.status = :status
    """)
    Double sumQuantityByMaterialIdAndStatus(@Param("materialId") Long materialId, @Param("status") Inventory.InventoryStatus status);

    @Query("""
    SELECT COALESCE(SUM(i.quantity), 0)
    FROM Inventory i
    WHERE i.product.productId = :productId 
      AND i.status = :status
    """)
    Double sumQuantityByProductIdAndStatus(@Param("productId") Long productId, @Param("status") Inventory.InventoryStatus status);

    // Các phương thức khác cho báo cáo tồn kho
    @Query("""
    SELECT new vn.unistock.unistockmanagementsystem.features.user.inventory.InventoryReportDTO(
        CASE WHEN m IS NOT NULL THEN m.materialCode ELSE p.productCode END,
        CASE WHEN m IS NOT NULL THEN m.materialName ELSE p.productName END,
        CASE WHEN m IS NOT NULL THEN m.isUsing ELSE p.isProductionActive END,
        CASE WHEN m IS NOT NULL THEN u1.unitName ELSE u2.unitName END,
        SUM(CASE WHEN i.status = vn.unistock.unistockmanagementsystem.entities.Inventory.InventoryStatus.AVAILABLE THEN i.quantity ELSE 0 END),
        SUM(CASE WHEN i.status = vn.unistock.unistockmanagementsystem.entities.Inventory.InventoryStatus.RESERVED THEN i.quantity ELSE 0 END),
        SUM(i.quantity),
        w.warehouseCode,
        w.warehouseName,
        w.warehouseId,
        CASE WHEN m IS NOT NULL THEN 'MATERIAL' ELSE 'PRODUCT' END,
        CASE WHEN p IS NOT NULL THEN p.productType.typeId ELSE NULL END,
        CASE WHEN m IS NOT NULL THEN m.materialType.materialTypeId ELSE NULL END
    )
    FROM Inventory i
    LEFT JOIN i.material m
    LEFT JOIN i.product p
    LEFT JOIN m.unit u1
    LEFT JOIN p.unit u2
    JOIN i.warehouse w
    GROUP BY 
        CASE WHEN m IS NOT NULL THEN m.materialCode ELSE p.productCode END,
        CASE WHEN m IS NOT NULL THEN m.materialName ELSE p.productName END,
        CASE WHEN m IS NOT NULL THEN m.isUsing ELSE p.isProductionActive END,
        CASE WHEN m IS NOT NULL THEN u1.unitName ELSE u2.unitName END,
        w.warehouseCode,
        w.warehouseName,
        w.warehouseId,
        CASE WHEN m IS NOT NULL THEN 'MATERIAL' ELSE 'PRODUCT' END,
        CASE WHEN p IS NOT NULL THEN p.productType.typeId ELSE NULL END,
        CASE WHEN m IS NOT NULL THEN m.materialType.materialTypeId ELSE NULL END
    """)
    List<InventoryReportDTO> getInventoryReportRaw();

    default Page<InventoryReportDTO> getInventoryReport(Pageable pageable) {
        List<InventoryReportDTO> all = getInventoryReportRaw();
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), all.size());
        return new PageImpl<>(all.subList(start, end), pageable, all.size());
    }

    // tổng số lượng tồn kho - kho phế liệu
    @Query("""
SELECT COALESCE(SUM(i.quantity), 0)
FROM Inventory i
WHERE i.product.productId = :productId
AND i.warehouse.warehouseName NOT LIKE '%phế liệu%'
""")
    Double getTotalQuantityAcrossWarehousesByProduct(@Param("productId") Long productId);

    @Query("""
SELECT COALESCE(SUM(i.quantity), 0)
FROM Inventory i
WHERE i.material.materialId = :materialId
AND i.warehouse.warehouseName NOT LIKE '%phế liệu%'
""")
    Double getTotalQuantityAcrossWarehousesByMaterial(@Param("materialId") Long materialId);


    Optional<Inventory> findByProduct_ProductIdAndWarehouse_WarehouseIdAndStatus(Long productId, Long warehouseId, Inventory.InventoryStatus status);

    Optional<Inventory> findByMaterial_MaterialIdAndWarehouse_WarehouseIdAndStatus(Long materialId, Long warehouseId, Inventory.InventoryStatus status);

    @Query("SELECT COUNT(i) > 0 FROM Inventory i WHERE i.warehouse.warehouseId = :warehouseId AND i.quantity > 0")
    boolean existsStockInWarehouse(@Param("warehouseId") Long warehouseId);


}