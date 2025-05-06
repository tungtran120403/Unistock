package vn.unistock.unistockmanagementsystem.features.user.saleOrders;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import vn.unistock.unistockmanagementsystem.entities.*;
import vn.unistock.unistockmanagementsystem.features.user.inventory.InventoryRepository;
import vn.unistock.unistockmanagementsystem.features.user.materials.MaterialsRepository;
import vn.unistock.unistockmanagementsystem.features.user.partner.PartnerRepository;
import vn.unistock.unistockmanagementsystem.features.user.products.ProductsRepository;
import vn.unistock.unistockmanagementsystem.features.user.purchaseRequests.PurchaseRequestDetailDTO;
import vn.unistock.unistockmanagementsystem.features.user.purchaseRequests.PurchaseRequestRepository;
import vn.unistock.unistockmanagementsystem.features.user.purchaseRequests.PurchaseRequestService;
import vn.unistock.unistockmanagementsystem.security.filter.CustomUserDetails;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SaleOrdersService {
    private final SaleOrdersRepository saleOrdersRepository;
    private final SalesOrderMaterialRepository salesOrderMaterialRepository;
    private final SaleOrdersMapper saleOrdersMapper;
    private final PartnerRepository partnerRepository;
    private final ProductsRepository productsRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final InventoryRepository inventoryRepository;
    private final PurchaseRequestService purchaseRequestService;
    private final MaterialsRepository materialsRepository;

    public SaleOrdersService(SaleOrdersRepository saleOrdersRepository,
                             SalesOrderMaterialRepository salesOrderMaterialRepository,
                             SaleOrdersMapper saleOrdersMapper,
                             PartnerRepository partnerRepository,
                             ProductsRepository productsRepository,
                             PurchaseRequestRepository purchaseRequestRepository,
                             InventoryRepository inventoryRepository,
                             PurchaseRequestService purchaseRequestService,
                             MaterialsRepository materialsRepository) {
        this.saleOrdersRepository = saleOrdersRepository;
        this.salesOrderMaterialRepository = salesOrderMaterialRepository;
        this.saleOrdersMapper = saleOrdersMapper;
        this.partnerRepository = partnerRepository;
        this.productsRepository = productsRepository;
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.inventoryRepository = inventoryRepository;
        this.purchaseRequestService = purchaseRequestService;
        this.materialsRepository = materialsRepository;
    }

    public Page<SaleOrdersDTO> getFilteredOrders(
            String orderCode,
            String partnerName,
            List<SalesOrder.OrderStatus> statuses,
            Date startDate,
            Date endDate,
            int page,
            int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "orderId"));

        List<SalesOrder.OrderStatus> filterStatuses = statuses != null && !statuses.isEmpty() ? statuses : null;

        Page<SalesOrder> salesOrderPage = saleOrdersRepository.findByFilters(
                orderCode != null && !orderCode.isBlank() ? orderCode : null,
                partnerName != null && !partnerName.isBlank() ? partnerName : null,
                filterStatuses,
                startDate,
                endDate,
                pageable);

        return salesOrderPage.map(saleOrder -> {
            SaleOrdersDTO dto = saleOrdersMapper.toDTO(saleOrder);
            enrichStatusLabel(dto, saleOrder);
            return dto;
        });
    }

    public String getNextOrderCode() {
        Long maxId = saleOrdersRepository.findMaxOrderId();
        Long nextId = (maxId != null ? maxId : 0L) + 1;
        return String.format("ĐH%05d", nextId);
    }

    public SaleOrdersDTO getOrderById(Long orderId) {
        SalesOrder saleOrder = saleOrdersRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));
        SaleOrdersDTO dto = saleOrdersMapper.toDTO(saleOrder);
        enrichStatusLabel(dto, saleOrder);
        return dto;
    }

    private void enrichStatusLabel(SaleOrdersDTO dto, SalesOrder saleOrder) {
        List<PurchaseRequest> requests = purchaseRequestRepository.findAllBySalesOrder_OrderId(saleOrder.getOrderId());

        SalesOrder.OrderStatus orderStatus = saleOrder.getStatus();

        if (orderStatus == SalesOrder.OrderStatus.PROCESSING) {
            if (requests.isEmpty()) {
                dto.setPurchaseRequestStatus("NONE");
                dto.setStatusLabel("Chưa có yêu cầu");
            } else {
                boolean allCancelled = requests.stream()
                        .allMatch(r -> r.getStatus() == PurchaseRequest.RequestStatus.REJECTED);
                boolean anyConfirmed = requests.stream()
                        .anyMatch(r -> r.getStatus() == PurchaseRequest.RequestStatus.CONFIRMED);

                if (anyConfirmed) {
                    dto.setPurchaseRequestStatus("CONFIRMED");
                    dto.setStatusLabel("Yêu cầu đã được duyệt");
                } else if (allCancelled) {
                    dto.setPurchaseRequestStatus("CANCELLED");
                    dto.setStatusLabel("Yêu cầu bị từ chối");
                } else {
                    dto.setPurchaseRequestStatus("PENDING");
                    dto.setStatusLabel("Đang chờ yêu cầu được duyệt");
                }
            }
        } else if (orderStatus == SalesOrder.OrderStatus.PREPARING_MATERIAL) {
            dto.setPurchaseRequestStatus("CONFIRMED");
            dto.setStatusLabel("Đang chuẩn bị vật tư");
        } else if (orderStatus == SalesOrder.OrderStatus.CANCELLED) {
            dto.setPurchaseRequestStatus("CANCELLED");
            dto.setStatusLabel("Đã hủy");
        } else {
            dto.setPurchaseRequestStatus("UNKNOWN");
            dto.setStatusLabel("Không rõ trạng thái");
        }
    }

    @Transactional
    public void cancelSalesOrder(Long orderId, String rejectionReason) {
        SalesOrder order = saleOrdersRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        order.setStatus(SalesOrder.OrderStatus.CANCELLED);
        order.setRejectionReason(rejectionReason);

        // Release RESERVED inventory for products
        List<SalesOrderDetail> details = order.getDetails();
        for (SalesOrderDetail detail : details) {
            Product product = detail.getProduct();
            double quantityToRelease = detail.getQuantity();

            List<Inventory> reservedInventories = inventoryRepository.findByProductIdAndStatus(
                    product.getProductId(), Inventory.InventoryStatus.RESERVED);

            Map<Long, Double> warehouseQuantities = new HashMap<>();
            for (Inventory inventory : reservedInventories) {
                if (quantityToRelease <= 0) break;

                double quantityInInventory = inventory.getQuantity();
                double quantityToReleaseFromThis = Math.min(quantityInInventory, quantityToRelease);

                Long warehouseId = inventory.getWarehouse().getWarehouseId();
                warehouseQuantities.merge(warehouseId, quantityToReleaseFromThis, Double::sum);

                quantityToRelease -= quantityToReleaseFromThis;
            }

            for (Map.Entry<Long, Double> entry : warehouseQuantities.entrySet()) {
                Long warehouseId = entry.getKey();
                double releasedQuantity = entry.getValue();

                Warehouse warehouse = reservedInventories.stream()
                        .filter(inv -> inv.getWarehouse().getWarehouseId().equals(warehouseId))
                        .findFirst()
                        .map(Inventory::getWarehouse)
                        .orElseThrow(() -> new RuntimeException("Warehouse not found for warehouseId: " + warehouseId));

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

                List<Inventory> reservedToDelete = reservedInventories.stream()
                        .filter(inv -> inv.getWarehouse().getWarehouseId().equals(warehouseId))
                        .toList();
                inventoryRepository.deleteAll(reservedToDelete);
            }

            if (quantityToRelease > 0) {
                System.err.println("Insufficient RESERVED inventory for productId " + product.getProductId() +
                        ": " + quantityToRelease + " units remaining");
            }
        }

        // Release RESERVED inventory for materials
        List<SalesOrderMaterial> materials = order.getMaterials();
        for (SalesOrderMaterial material : materials) {
            Material mat = material.getMaterial();
            double quantityToRelease = material.getRequiredQuantity();

            List<Inventory> reservedInventories = inventoryRepository.findByMaterialIdAndStatus(
                    mat.getMaterialId(), Inventory.InventoryStatus.RESERVED);

            Map<Long, Double> warehouseQuantities = new HashMap<>();
            for (Inventory inventory : reservedInventories) {
                if (quantityToRelease <= 0) break;

                double quantityInInventory = inventory.getQuantity();
                double quantityToReleaseFromThis = Math.min(quantityInInventory, quantityToRelease);

                Long warehouseId = inventory.getWarehouse().getWarehouseId();
                warehouseQuantities.merge(warehouseId, quantityToReleaseFromThis, Double::sum);

                quantityToRelease -= quantityToReleaseFromThis;
            }

            for (Map.Entry<Long, Double> entry : warehouseQuantities.entrySet()) {
                Long warehouseId = entry.getKey();
                double releasedQuantity = entry.getValue();

                Warehouse warehouse = reservedInventories.stream()
                        .filter(inv -> inv.getWarehouse().getWarehouseId().equals(warehouseId))
                        .findFirst()
                        .map(Inventory::getWarehouse)
                        .orElseThrow(() -> new RuntimeException("Warehouse not found for warehouseId: " + warehouseId));

                Inventory availableInventory = inventoryRepository.findByWarehouseAndMaterialAndStatus(
                                warehouse, mat, Inventory.InventoryStatus.AVAILABLE)
                        .orElse(null);

                if (availableInventory == null) {
                    availableInventory = Inventory.builder()
                            .warehouse(warehouse)
                            .material(mat)
                            .status(Inventory.InventoryStatus.AVAILABLE)
                            .quantity(0.0)
                            .build();
                }
                availableInventory.setQuantity(availableInventory.getQuantity() + releasedQuantity);
                availableInventory.setLastUpdated(LocalDateTime.now());
                availableInventory.setSalesOrder(null);
                inventoryRepository.save(availableInventory);

                List<Inventory> reservedToDelete = reservedInventories.stream()
                        .filter(inv -> inv.getWarehouse().getWarehouseId().equals(warehouseId))
                        .toList();
                inventoryRepository.deleteAll(reservedToDelete);
            }

            if (quantityToRelease > 0) {
                System.err.println("Insufficient RESERVED inventory for materialId " + mat.getMaterialId() +
                        ": " + quantityToRelease + " units remaining");
            }
        }

        // Cancel related purchase requests
        List<PurchaseRequest> requests = purchaseRequestRepository.findAllBySalesOrder_OrderId(orderId);
        for (PurchaseRequest pr : requests) {
            pr.setStatus(PurchaseRequest.RequestStatus.CANCELLED);
            pr.setRejectionReason("Đơn hàng đã bị hủy");
            purchaseRequestRepository.save(pr);
        }

        saleOrdersRepository.save(order);
    }

    @Transactional
    public SaleOrdersDTO createSaleOrder(SaleOrdersDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        User currentUser = userDetails.getUser();

        Partner partner = partnerRepository.findByPartnerCode(dto.getPartnerCode())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Partner not found with code: " + dto.getPartnerCode()
                ));

        if (dto.getOrderDetails() != null) {
            dto.getOrderDetails().forEach(detailDTO -> {
                Product prod = productsRepository.findByProductCode(detailDTO.getProductCode())
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Product not found with code: " + detailDTO.getProductCode()
                        ));
                detailDTO.setProductId(prod.getProductId());
            });
        }

        SalesOrder order = saleOrdersMapper.toEntity(dto, materialsRepository);
        order.setPartner(partner);
        order.setCreatedByUser(currentUser);

        if (order.getStatus() == null) {
            order.setStatus(SalesOrder.OrderStatus.PROCESSING);
        }

        if (order.getDetails() != null) {
            order.getDetails().forEach(detail -> {
                detail.setSalesOrder(order);
                Product persistentProduct =
                        productsRepository.getReferenceById(detail.getProduct().getProductId());
                detail.setProduct(persistentProduct);
            });
        }

        if (order.getMaterials() != null) {
            order.getMaterials().forEach(material -> {
                material.setSalesOrder(order);
                Material persistentMaterial =
                        materialsRepository.getReferenceById(material.getMaterial().getMaterialId());
                material.setMaterial(persistentMaterial);
            });
        }

        SalesOrder saved = saleOrdersRepository.save(order);
        return saleOrdersMapper.toDTO(saved);
    }

    @Transactional
    public SaleOrdersDTO updateSaleOrder(Long orderId, SaleOrdersDTO dto) {
        SalesOrder existing = saleOrdersRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        Partner partner = partnerRepository.findByPartnerCode(dto.getPartnerCode())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Partner với code: " + dto.getPartnerCode()));

        partner.setPartnerName(dto.getPartnerName());
        partner.setAddress(dto.getAddress());
        partner.setPhone(dto.getPhoneNumber());
        partner.setContactName(dto.getContactName());

        SalesOrder mapped = saleOrdersMapper.toEntity(dto, materialsRepository);
        mapped.setPartner(partner);
        mapped.setOrderId(existing.getOrderId());

        if (mapped.getStatus() == null) mapped.setStatus(existing.getStatus());

        // First, track existing details by their ID for potential updates
        Map<Long, SalesOrderDetail> existingDetailsMap = existing.getDetails().stream()
                .filter(d -> d.getOrderDetailId() != null)
                .collect(Collectors.toMap(SalesOrderDetail::getOrderDetailId, d -> d));

// Clear the current details list
        existing.getDetails().clear();

        if (mapped.getDetails() != null) {
            for (SalesOrderDetail detail : mapped.getDetails()) {
                detail.setSalesOrder(existing);
                Product persistProd = productsRepository.getReferenceById(detail.getProduct().getProductId());
                detail.setProduct(persistProd);

                if (detail.getOrderDetailId() != null && existingDetailsMap.containsKey(detail.getOrderDetailId())) {
                    // Update existing detail
                    SalesOrderDetail existingDetail = existingDetailsMap.get(detail.getOrderDetailId());
                    existingDetail.setQuantity(detail.getQuantity());
                    existingDetail.setReceivedQuantity(detail.getReceivedQuantity());
                    // ... any other fields to update
                    existing.getDetails().add(existingDetail);
                } else {
                    // New detail (no ID)
                    existing.getDetails().add(detail);
                }
            }
        }


        // Handle materials to avoid duplicates
        if (mapped.getMaterials() != null) {
            // Fetch all existing materials from the database
            List<SalesOrderMaterial> existingMaterials = salesOrderMaterialRepository.findBySalesOrderOrderId(orderId);
            Map<Long, SalesOrderMaterial> existingMaterialsMap = new HashMap<>();
            for (SalesOrderMaterial material : existingMaterials) {
                existingMaterialsMap.put(material.getMaterial().getMaterialId(), material);
            }

            // Clear the in-memory materials list
            existing.getMaterials().clear();

            // Process new materials from DTO
            for (SalesOrderMaterial material : mapped.getMaterials()) {
                Material persistMat = materialsRepository.getReferenceById(material.getMaterial().getMaterialId());
                material.setMaterial(persistMat);
                material.setSalesOrder(existing);

                // Check if the material exists in the database
                Optional<SalesOrderMaterial> dbMaterial = salesOrderMaterialRepository
                        .findBySalesOrderOrderIdAndMaterialMaterialId(orderId, persistMat.getMaterialId());
                if (dbMaterial.isPresent()) {
                    // Update existing material
                    SalesOrderMaterial existingMaterial = dbMaterial.get();
                    existingMaterial.setRequiredQuantity(material.getRequiredQuantity());
                    existingMaterial.setReceivedQuantity(material.getReceivedQuantity());
                    existing.getMaterials().add(existingMaterial);
                    salesOrderMaterialRepository.save(existingMaterial);
                } else {
                    // Add new material
                    existing.getMaterials().add(material);
                }
            }

            // Remove materials that are no longer in the DTO
            existingMaterialsMap.forEach((materialId, existingMaterial) -> {
                if (!mapped.getMaterials().stream()
                        .anyMatch(m -> m.getMaterial().getMaterialId().equals(materialId))) {
                    salesOrderMaterialRepository.delete(existingMaterial);
                }
            });
        } else {
            // If no materials in DTO, remove all existing materials
            salesOrderMaterialRepository.deleteBySalesOrderOrderId(orderId);
            existing.getMaterials().clear();
        }

        mapped.setCreatedByUser(existing.getCreatedByUser());
        mapped.setCreatedAt(existing.getCreatedAt());

        SalesOrder saved = saleOrdersRepository.save(existing);
        return saleOrdersMapper.toDTO(saved);
    }

    @Transactional
    public void setPreparingMaterialStatus(PrepareMaterialForSaleOrderDTO request) {
        SalesOrder order = saleOrdersRepository.findById(request.getSaleOrderId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        order.setStatus(SalesOrder.OrderStatus.PREPARING_MATERIAL);

        if (request.getUsedProductsFromWarehouses() != null && !request.getUsedProductsFromWarehouses().isEmpty()) {
            purchaseRequestService.reserveProductsForSalesOrder(order, request.getUsedProductsFromWarehouses());
        }

        if (request.getUsedMaterialsFromWarehouses() != null && !request.getUsedMaterialsFromWarehouses().isEmpty()) {
            List<PurchaseRequestDetailDTO> materialReserveList = request.getUsedMaterialsFromWarehouses().stream()
                    .filter(m -> m.getQuantity() > 0)
                    .map(m -> {
                        PurchaseRequestDetailDTO dto = new PurchaseRequestDetailDTO();
                        dto.setMaterialId(m.getMaterialId());
                        dto.setQuantity((int) m.getQuantity());
                        return dto;
                    })
                    .toList();

            purchaseRequestService.reserveMaterialsForPurchaseRequest(materialReserveList, order);
        }

        saleOrdersRepository.save(order);
    }

    @Transactional(readOnly = true)
    public boolean isSaleOrderFullyIssuedMaterial(Long orderId) {
        SalesOrder order = saleOrdersRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + orderId));

        if (order.getMaterials() == null || order.getMaterials().isEmpty()) {
            return true; // Nếu không có vật tư yêu cầu, coi như đã đủ
        }

        for (SalesOrderMaterial material : order.getMaterials()) {
            int requiredQty = material.getRequiredQuantity();
            int receivedQty = material.getReceivedQuantity();

            if (receivedQty < requiredQty) {
                return false; // Nếu còn vật tư nào nhận thiếu ➔ đơn hàng chưa đủ
            }
        }

        return true;
    }
}