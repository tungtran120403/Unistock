package vn.unistock.unistockmanagementsystem.features.user.purchaseRequests;

import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.web.server.ResponseStatusException;
import vn.unistock.unistockmanagementsystem.entities.*;
import vn.unistock.unistockmanagementsystem.features.user.inventory.InventoryRepository;
import vn.unistock.unistockmanagementsystem.features.user.materials.MaterialsRepository;
import vn.unistock.unistockmanagementsystem.features.user.partner.PartnerRepository;
import vn.unistock.unistockmanagementsystem.features.user.saleOrders.SaleOrdersRepository;
import vn.unistock.unistockmanagementsystem.features.user.saleOrders.UsedMaterialWarehouseDTO;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PurchaseRequestService {
    private static final Logger logger = LoggerFactory.getLogger(PurchaseRequestService.class);
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final MaterialsRepository materialRepository;
    private final PartnerRepository partnerRepository;
    private final SaleOrdersRepository saleOrdersRepository;
    private final InventoryRepository inventoryRepository;
    private final PurchaseRequestMapper purchaseRequestMapper;
    private final PurchaseRequestDetailMapper purchaseRequestDetailMapper;


    public Page<PurchaseRequestDTO> getAllPurchaseRequests(Pageable pageable) {
        Page<PurchaseRequest> page = purchaseRequestRepository.findAll(pageable);
        return page.map(purchaseRequestMapper::toDTO);
    }



    public PurchaseRequestDTO getPurchaseRequestById(Long id) {
        PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu mua vật tư với id: " + id));

        Hibernate.initialize(purchaseRequest.getPurchaseRequestDetails());
        for (PurchaseRequestDetail detail : purchaseRequest.getPurchaseRequestDetails()) {
            Hibernate.initialize(detail.getMaterial());
            Hibernate.initialize(detail.getMaterial().getUnit());
            Hibernate.initialize(detail.getPartner());
        }

        return purchaseRequestMapper.toDTO(purchaseRequest);
    }

    @Transactional
    public PurchaseRequestDTO createManualPurchaseRequest(PurchaseRequestDTO dto) {
        // Khởi tạo request chính
        PurchaseRequest purchaseRequest = new PurchaseRequest();
        purchaseRequest.setPurchaseRequestCode(dto.getPurchaseRequestCode());
        purchaseRequest.setNotes(dto.getNotes());
        purchaseRequest.setStatus(PurchaseRequest.RequestStatus.PENDING);
        purchaseRequest.setRejectionReason(null);
        purchaseRequest.setCreatedDate(LocalDateTime.now());

        // Liên kết SalesOrder nếu có
        SalesOrder salesOrder = null;
        if (dto.getSaleOrderId() != null) {
            salesOrder = saleOrdersRepository.findById(dto.getSaleOrderId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));
            purchaseRequest.setSalesOrder(salesOrder);
        }

        // Convert detail DTO → entity + gán quan hệ (giữ nguyên code cũ)
        List<PurchaseRequestDetail> details = purchaseRequestDetailMapper.toEntityList(dto.getPurchaseRequestDetails());
        for (int i = 0; i < details.size(); i++) {
            PurchaseRequestDetail detail = details.get(i);
            PurchaseRequestDetailDTO detailDTO = dto.getPurchaseRequestDetails().get(i);
            Material material = materialRepository.findById(detailDTO.getMaterialId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy vật tư với ID: " + detailDTO.getMaterialId()));
            Partner partner = partnerRepository.findById(detailDTO.getPartnerId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy NCC với ID: " + detailDTO.getPartnerId()));
            detail.setMaterial(material);
            detail.setPartner(partner);
            detail.setPurchaseRequest(purchaseRequest);
        }
        purchaseRequest.setPurchaseRequestDetails(details);

        // ===== 1. Trừ kho sản phẩm (cũ, giữ nguyên) =====
        if (dto.getSaleOrderId() != null && !CollectionUtils.isEmpty(dto.getUsedProductsFromWarehouses())) {
            reserveProductsForSalesOrder(salesOrder, dto.getUsedProductsFromWarehouses());
        }

        // ===== 2. Trừ kho NVL (MỚI) =====
        if (dto.getSaleOrderId() != null && !CollectionUtils.isEmpty(dto.getUsedMaterialsFromWarehouses())) {
            reserveMaterialsFromWarehouses(dto.getUsedMaterialsFromWarehouses(), salesOrder);
        } else if (!CollectionUtils.isEmpty(dto.getUsedMaterialsFromWarehouses())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SalesOrder is required to reserve materials");
        }

        // Lưu DB & trả DTO
        PurchaseRequest saved = purchaseRequestRepository.save(purchaseRequest);
        return purchaseRequestMapper.toDTO(saved);
    }



    private void reserveMaterialsFromWarehouses(List<UsedMaterialWarehouseDTO> usedMaterials,
                                                SalesOrder salesOrder) {

        if (CollectionUtils.isEmpty(usedMaterials)) return;

        for (UsedMaterialWarehouseDTO entry : usedMaterials) {
            double quantityToReserve = entry.getQuantity();
            List<Inventory> availableInventories = inventoryRepository
                    .findByMaterialIdAndStatus(entry.getMaterialId(), Inventory.InventoryStatus.AVAILABLE)
                    .stream()
                    .filter(inv -> inv.getWarehouse().getWarehouseId().equals(entry.getWarehouseId()))
                    .sorted(Comparator.comparing(Inventory::getInventoryId))
                    .toList();

            for (Inventory available : availableInventories) {
                if (quantityToReserve <= 0) break;

                double toUse = Math.min(available.getQuantity(), quantityToReserve);
                available.setQuantity(available.getQuantity() - toUse);
                if (available.getQuantity() == 0) inventoryRepository.delete(available);
                else inventoryRepository.save(available);

                Inventory reserved = inventoryRepository
                        .findByMaterial_MaterialIdAndWarehouse_WarehouseIdAndStatusAndSalesOrder(
                                entry.getMaterialId(),
                                entry.getWarehouseId(),
                                Inventory.InventoryStatus.RESERVED,
                                salesOrder)
                        .orElseGet(() -> {
                            Inventory inv = new Inventory();
                            inv.setMaterial(available.getMaterial());
                            inv.setWarehouse(available.getWarehouse());
                            inv.setStatus(Inventory.InventoryStatus.RESERVED);
                            inv.setQuantity(0.0);
                            inv.setSalesOrder(salesOrder);
                            return inv;
                        });

                reserved.setQuantity(reserved.getQuantity() + toUse);
                reserved.setLastUpdated(LocalDateTime.now());
                inventoryRepository.save(reserved);

                quantityToReserve -= toUse;
            }


        }
    }

    public void reserveMaterialsForPurchaseRequest(List<PurchaseRequestDetailDTO> detailDTOs, SalesOrder salesOrder) {
        if (salesOrder == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SalesOrder is required for reserving materials");
        }

        for (PurchaseRequestDetailDTO detailDto : detailDTOs) {
            if (detailDto.getQuantity() <= 0) continue;

            Material material = materialRepository.findById(detailDto.getMaterialId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy vật tư với ID: " + detailDto.getMaterialId()));

            double quantityToReserve = detailDto.getQuantity();
            List<Inventory> availableInventories = inventoryRepository.findByMaterialIdAndStatus(
                    material.getMaterialId(), Inventory.InventoryStatus.AVAILABLE);
            availableInventories.sort(Comparator.comparing(Inventory::getInventoryId));

            for (Inventory available : availableInventories) {
                if (quantityToReserve <= 0) break;

                double availableQty = available.getQuantity();
                double toUse = Math.min(availableQty, quantityToReserve);

                available.setQuantity(availableQty - toUse);
                if (available.getQuantity() == 0) {
                    inventoryRepository.delete(available);
                } else {
                    inventoryRepository.save(available);
                }

                Inventory reserved = inventoryRepository.findByMaterial_MaterialIdAndWarehouse_WarehouseIdAndStatusAndSalesOrder(
                        material.getMaterialId(),
                        available.getWarehouse().getWarehouseId(),
                        Inventory.InventoryStatus.RESERVED,
                        salesOrder
                ).orElseGet(() -> {
                    Inventory newReserved = new Inventory();
                    newReserved.setMaterial(material);
                    newReserved.setWarehouse(available.getWarehouse());
                    newReserved.setStatus(Inventory.InventoryStatus.RESERVED);
                    newReserved.setQuantity(0.0);
                    newReserved.setSalesOrder(salesOrder);
                    return newReserved;
                });

                reserved.setQuantity(reserved.getQuantity() + toUse);
                reserved.setLastUpdated(LocalDateTime.now());
                inventoryRepository.save(reserved);

                quantityToReserve -= toUse;
            }


        }
    }

    public void reserveProductsForSalesOrder(SalesOrder salesOrder, List<UsedProductWarehouseDTO> usedProducts) {
        if (salesOrder == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SalesOrder is required for reserving products");
        }

        if (usedProducts == null || usedProducts.isEmpty()) return;

        for (UsedProductWarehouseDTO entry : usedProducts) {
            Long productId = entry.getProductId();
            Long warehouseId = entry.getWarehouseId();
            double requiredQuantity = entry.getQuantity();

            List<Inventory> availableInventories = inventoryRepository.findByProductIdAndStatus(productId, Inventory.InventoryStatus.AVAILABLE)
                    .stream()
                    .filter(inv -> inv.getWarehouse().getWarehouseId().equals(warehouseId))
                    .sorted(Comparator.comparing(Inventory::getInventoryId))
                    .collect(Collectors.toList());

            for (Inventory inventory : availableInventories) {
                if (requiredQuantity <= 0) break;

                double availableQty = inventory.getQuantity();
                double toUse = Math.min(availableQty, requiredQuantity);

                inventory.setQuantity(availableQty - toUse);
                if (inventory.getQuantity() == 0) {
                    inventoryRepository.delete(inventory);
                } else {
                    inventoryRepository.save(inventory);
                }

                Inventory reserved = inventoryRepository.findByProduct_ProductIdAndWarehouse_WarehouseIdAndStatusAndSalesOrder(
                        productId,
                        warehouseId,
                        Inventory.InventoryStatus.RESERVED,
                        salesOrder
                ).orElseGet(() -> {
                    Inventory newReserved = new Inventory();
                    newReserved.setProduct(inventory.getProduct());
                    newReserved.setWarehouse(inventory.getWarehouse());
                    newReserved.setStatus(Inventory.InventoryStatus.RESERVED);
                    newReserved.setQuantity(0.0);
                    newReserved.setSalesOrder(salesOrder);
                    return newReserved;
                });

                reserved.setQuantity(reserved.getQuantity() + toUse);
                reserved.setLastUpdated(LocalDateTime.now());
                inventoryRepository.save(reserved);

                requiredQuantity -= toUse;
            }

            if (requiredQuantity > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không đủ số lượng tại kho " + warehouseId + " cho sản phẩm " + productId);
            }
        }
    }



    @Transactional
    public PurchaseRequestDTO updatePurchaseRequestStatus(Long id, String status, String rejectionReason) {
        PurchaseRequest request = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu mua vật tư với ID: " + id));

        PurchaseRequest.RequestStatus statusEnum = PurchaseRequest.RequestStatus.valueOf(status);
        request.setStatus(statusEnum);

        if (statusEnum == PurchaseRequest.RequestStatus.CANCELLED) {
            request.setRejectionReason(rejectionReason);

            // Release RESERVED inventory for materials
            List<PurchaseRequestDetail> details = request.getPurchaseRequestDetails();
            for (PurchaseRequestDetail detail : details) {
                Material material = detail.getMaterial();
                double quantityToRelease = detail.getQuantity();

                // Fetch all RESERVED inventory for this material
                List<Inventory> reservedInventories = inventoryRepository.findByMaterialIdAndStatus(
                        material.getMaterialId(), Inventory.InventoryStatus.RESERVED);

                // Group quantities by warehouse
                Map<Long, Double> warehouseQuantities = new HashMap<>();
                for (Inventory inventory : reservedInventories) {
                    if (quantityToRelease <= 0) break;

                    double quantityInInventory = inventory.getQuantity();
                    double quantityToReleaseFromThis = Math.min(quantityInInventory, quantityToRelease);

                    Long warehouseId = inventory.getWarehouse().getWarehouseId();
                    warehouseQuantities.merge(warehouseId, quantityToReleaseFromThis, Double::sum);

                    quantityToRelease -= quantityToReleaseFromThis;
                }

                // Consolidate inventory for each warehouse
                for (Map.Entry<Long, Double> entry : warehouseQuantities.entrySet()) {
                    Long warehouseId = entry.getKey();
                    double releasedQuantity = entry.getValue();

                    Warehouse warehouse = reservedInventories.stream()
                            .filter(inv -> inv.getWarehouse().getWarehouseId().equals(warehouseId))
                            .findFirst()
                            .map(Inventory::getWarehouse)
                            .orElseThrow(() -> new RuntimeException("Warehouse not found for warehouseId: " + warehouseId));

                    // Find or create AVAILABLE inventory
                    Inventory availableInventory = inventoryRepository.findByWarehouseAndMaterialAndStatus(
                                    warehouse, material, Inventory.InventoryStatus.AVAILABLE)
                            .orElse(null);

                    if (availableInventory == null) {
                        availableInventory = Inventory.builder()
                                .warehouse(warehouse)
                                .material(material)
                                .status(Inventory.InventoryStatus.AVAILABLE)
                                .quantity(0.0)
                                .build();
                    }
                    availableInventory.setQuantity(availableInventory.getQuantity() + releasedQuantity);
                    availableInventory.setLastUpdated(LocalDateTime.now());
                    availableInventory.setSalesOrder(null);
                    inventoryRepository.save(availableInventory);

                    // Delete RESERVED records for this warehouse
                    List<Inventory> reservedToDelete = reservedInventories.stream()
                            .filter(inv -> inv.getWarehouse().getWarehouseId().equals(warehouseId))
                            .toList();
                    inventoryRepository.deleteAll(reservedToDelete);
                }

                if (quantityToRelease > 0) {
                    logger.warn("Insufficient RESERVED inventory for materialId {}: {} units remaining",
                            material.getMaterialId(), quantityToRelease);
                }
            }

            // Release RESERVED inventory for products if linked to a SalesOrder
            if (request.getSalesOrder() != null) {
                SalesOrder salesOrder = request.getSalesOrder();
                List<SalesOrderDetail> orderDetails = salesOrder.getDetails();
                for (SalesOrderDetail detail : orderDetails) {
                    Product product = detail.getProduct();
                    double quantityToRelease = detail.getQuantity();

                    // Fetch all RESERVED inventory for this product
                    List<Inventory> reservedInventories = inventoryRepository.findByProductIdAndStatus(
                            product.getProductId(), Inventory.InventoryStatus.RESERVED);

                    // Group quantities by warehouse
                    Map<Long, Double> warehouseQuantities = new HashMap<>();
                    for (Inventory inventory : reservedInventories) {
                        if (quantityToRelease <= 0) break;

                        double quantityInInventory = inventory.getQuantity();
                        double quantityToReleaseFromThis = Math.min(quantityInInventory, quantityToRelease);

                        Long warehouseId = inventory.getWarehouse().getWarehouseId();
                        warehouseQuantities.merge(warehouseId, quantityToReleaseFromThis, Double::sum);

                        quantityToRelease -= quantityToReleaseFromThis;
                    }

                    // Consolidate inventory for each warehouse
                    for (Map.Entry<Long, Double> entry : warehouseQuantities.entrySet()) {
                        Long warehouseId = entry.getKey();
                        double releasedQuantity = entry.getValue();

                        Warehouse warehouse = reservedInventories.stream()
                                .filter(inv -> inv.getWarehouse().getWarehouseId().equals(warehouseId))
                                .findFirst()
                                .map(Inventory::getWarehouse)
                                .orElseThrow(() -> new RuntimeException("Warehouse not found for warehouseId: " + warehouseId));

                        // Find or create AVAILABLE inventory
                        Inventory availableInventory = inventoryRepository.findByWarehouseAndProductAndStatus(
                                        warehouse, product, Inventory.InventoryStatus.AVAILABLE)
                                .orElse(null);

                        if (availableInventory == null) {
                            availableInventory = Inventory.builder()
                                    .warehouse(warehouse)
                                    .product(product)
                                    .status(Inventory.InventoryStatus.AVAILABLE)
                                    .quantity(0.0)
                                    .build();
                        }
                        availableInventory.setQuantity(availableInventory.getQuantity() + releasedQuantity);
                        availableInventory.setLastUpdated(LocalDateTime.now());
                        availableInventory.setSalesOrder(null);
                        inventoryRepository.save(availableInventory);

                        // Delete RESERVED records for this warehouse
                        List<Inventory> reservedToDelete = reservedInventories.stream()
                                .filter(inv -> inv.getWarehouse().getWarehouseId().equals(warehouseId))
                                .toList();
                        inventoryRepository.deleteAll(reservedToDelete);
                    }

                    if (quantityToRelease > 0) {
                        logger.warn("Insufficient RESERVED inventory for productId {}: {} units remaining",
                                product.getProductId(), quantityToRelease);
                    }
                }
            }
        } else {
            // For non-CANCELLED statuses, clear rejectionReason
            request.setRejectionReason(null);
        }

        purchaseRequestRepository.save(request);

        // Update related SalesOrder status if applicable
        if (request.getSalesOrder() != null) {
            SalesOrder salesOrder = request.getSalesOrder();
            List<PurchaseRequest> allRequests = purchaseRequestRepository.findAllBySalesOrder_OrderId(salesOrder.getOrderId());

            boolean allCancelled = allRequests.stream().allMatch(r -> r.getStatus() == PurchaseRequest.RequestStatus.CANCELLED);
            boolean anyConfirmed = allRequests.stream().anyMatch(r -> r.getStatus() == PurchaseRequest.RequestStatus.CONFIRMED);

            if (statusEnum == PurchaseRequest.RequestStatus.CANCELLED && allCancelled) {
                salesOrder.setStatus(SalesOrder.OrderStatus.PROCESSING);
            } else if (statusEnum == PurchaseRequest.RequestStatus.CONFIRMED || anyConfirmed) {
                salesOrder.setStatus(SalesOrder.OrderStatus.PREPARING_MATERIAL);
            }

            saleOrdersRepository.save(salesOrder);
        }

        return purchaseRequestMapper.toDTO(request);
    }

    @Transactional
    public String getNextRequestCode() {
        try {
            Long maxId = purchaseRequestRepository.findMaxPurchaseRequestId();
            Long nextId = (maxId != null) ? (maxId + 1) : 1;
            return String.format("YC%05d", nextId);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể tạo mã yêu cầu mới: " + e.getMessage(), e);
        }
    }

//    @Transactional
//    public PurchaseRequestDTO createFromSaleOrder(Long saleOrderId) {
//        if (!canCreatePurchaseRequest(saleOrderId)) {
//            throw new ResponseStatusException(
//                    HttpStatus.BAD_REQUEST,
//                    "Đơn hàng này đã có yêu cầu mua vật tư đang hoạt động!"
//            );
//        }
//
//        List<ProductMaterialsDTO> materials = productMaterialsService.getMaterialsBySaleOrderId(saleOrderId);
//        logger.info("Materials for SaleOrder {}: {}", saleOrderId, materials);
//        if (materials.isEmpty()) {
//            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy vật tư cho đơn hàng với ID: " + saleOrderId);
//        }
//
//        List<PurchaseRequestDetail> details = new ArrayList<>();
//        for (ProductMaterialsDTO materialDTO : materials) {
//            Material material = materialRepository.findById(materialDTO.getMaterialId())
//                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy vật tư với ID: " + materialDTO.getMaterialId()));
//            if (material.getUnit() == null) {
//                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vật tư " + materialDTO.getMaterialId() + " không có đơn vị (unit)");
//            }
//            if (material.getMaterialType() == null) {
//                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vật tư " + materialDTO.getMaterialId() + " không có loại vật tư (materialType)");
//            }
//
//            List<Partner> suppliers = partnerRepository.findPartnersByMaterialId(materialDTO.getMaterialId());
//
//            if (suppliers.isEmpty()) {
//                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy nhà cung cấp cho vật tư: " + materialDTO.getMaterialName());
//            }
//
//            PurchaseRequestDetail detail = new PurchaseRequestDetail();
//            detail.setMaterial(material);
//            detail.setQuantity(materialDTO.getQuantity());
//            detail.setPartner(suppliers.get(0));
//            details.add(detail);
//        }
//
//        String purchaseRequestCode = getNextRequestCode();
//
//        PurchaseRequest purchaseRequest = new PurchaseRequest();
//        purchaseRequest.setPurchaseRequestCode(purchaseRequestCode);
//        purchaseRequest.setSalesOrder(saleOrdersRepository.findById(saleOrderId)
//                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng với ID: " + saleOrderId)));
//        purchaseRequest.setCreatedDate(LocalDateTime.now());
//        purchaseRequest.setStatus(PurchaseRequest.RequestStatus.PENDING);
//        purchaseRequest = purchaseRequestRepository.save(purchaseRequest);
//
//        for (PurchaseRequestDetail detail : details) {
//            detail.setPurchaseRequest(purchaseRequest);
//            purchaseRequestDetailRepository.save(detail);
//        }
//        purchaseRequestDetailRepository.flush();
//
//        purchaseRequest = purchaseRequestRepository.findById(purchaseRequest.getPurchaseRequestId())
//                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu mua vật tư vừa tạo"));
//
//        List<PurchaseRequestDetail> loadedDetails = purchaseRequestDetailRepository.findAllByPurchaseRequest(purchaseRequest);
//        for (PurchaseRequestDetail detail : loadedDetails) {
//            Hibernate.initialize(detail.getMaterial());
//            Hibernate.initialize(detail.getMaterial().getUnit());
//            Hibernate.initialize(detail.getMaterial().getMaterialType());
//            Hibernate.initialize(detail.getPartner());
//        }
//        purchaseRequest.setPurchaseRequestDetails(loadedDetails);
//
//        PurchaseRequestDTO dto = purchaseRequestMapper.toDTO(purchaseRequest);
//        if (dto.getPurchaseRequestDetails() == null) {
//            dto.setPurchaseRequestDetails(new ArrayList<>());
//        }
//
//        return dto;
//    }

    public boolean canCreatePurchaseRequest(Long orderId) {
        List<PurchaseRequest> requests = purchaseRequestRepository.findAllBySalesOrder_OrderId(orderId);
        if (requests.isEmpty()) return true;

        return requests.stream().allMatch(req -> req.getStatus() == PurchaseRequest.RequestStatus.CANCELLED);
    }

}
