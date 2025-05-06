package vn.unistock.unistockmanagementsystem.features.user.issueNote;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import vn.unistock.unistockmanagementsystem.entities.*;
import vn.unistock.unistockmanagementsystem.features.user.inventory.InventoryRepository;
import vn.unistock.unistockmanagementsystem.features.user.inventory.InventoryTransactionRepository;
import vn.unistock.unistockmanagementsystem.features.user.materials.MaterialsRepository;
import vn.unistock.unistockmanagementsystem.features.user.notification.NotificationService;
import vn.unistock.unistockmanagementsystem.features.user.products.ProductsRepository;
import vn.unistock.unistockmanagementsystem.features.user.receiptnote.PaperEvidenceRepository;
import vn.unistock.unistockmanagementsystem.features.user.saleOrders.SaleOrdersRepository;
import vn.unistock.unistockmanagementsystem.features.user.units.UnitRepository;
import vn.unistock.unistockmanagementsystem.features.user.warehouse.WarehouseRepository;
import vn.unistock.unistockmanagementsystem.security.filter.CustomUserDetails;
import vn.unistock.unistockmanagementsystem.utils.storage.AzureBlobService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IssueNoteService {
    private static final Logger logger = LoggerFactory.getLogger(IssueNoteService.class);

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private IssueNoteRepository issueNoteRepository;

    @Autowired
    private IssueNoteDetailRepository issueNoteDetailRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private InventoryTransactionRepository inventoryTransactionRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private MaterialsRepository materialRepository;

    @Autowired
    private ProductsRepository productRepository;

    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private PaperEvidenceRepository paperEvidenceRepository;

    @Autowired
    private AzureBlobService azureBlobService;

    @Autowired
    private IssueNoteMapper issueNoteMapper;

    @Autowired
    private SaleOrdersRepository salesOrderRepository;
    @Autowired
    private ReceiveOutsourceRepository receiveOutsourceRepository;
    @Autowired
    private ReceiveOutsourceMapper receiveOutsourceMapper;
    @Autowired
    private ReceiveOutsourceMaterialMapper receiveOutsourceMaterialMapper;

    public Page<IssueNoteDTO> getAllIssueNotes(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ginId"));
        Page<GoodIssueNote> notes = issueNoteRepository.findAll(pageable);
        return notes.map(issueNoteMapper::toDTO);
    }

    public Page<IssueNoteDTO> getAllIssueNotesFiltered(
            int page, int size, String search, LocalDate startDate, LocalDate endDate, List<String> categories
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ginId"));

        LocalDateTime startDateTime = (startDate != null) ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = (endDate != null) ? endDate.atTime(23, 59, 59) : null;

        Page<GoodIssueNote> notes = issueNoteRepository.searchFilteredIssueNotes(
                search, startDateTime, endDateTime, categories, pageable
        );
        return notes.map(issueNoteMapper::toDTO);
    }

    @Transactional
    public IssueNoteDTO createGoodIssue(IssueNoteDTO issueNoteDto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        try {
            CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
            User currentUser = userDetails.getUser();

            GoodIssueNote issueNote = GoodIssueNote.builder()
                    .ginCode(issueNoteDto.getGinCode())
                    .description(issueNoteDto.getDescription())
                    .category(issueNoteDto.getCategory())
                    .issueDate(issueNoteDto.getIssueDate())
                    .createdBy(currentUser)
                    .details(new ArrayList<>())
                    .build();

            if (issueNoteDto.getPartnerId() != null) {
                Partner partner = Partner.builder().partnerId(issueNoteDto.getPartnerId()).build();
                issueNote.setPartner(partner);
            }

            if (issueNoteDto.getReceiver() != null) {
                issueNote.setReceiver(issueNoteDto.getReceiver());
            }

            boolean hasSalesOrder = issueNoteDto.getSoId() != null;
            if (hasSalesOrder) {
                SalesOrder salesOrder = salesOrderRepository.findById(issueNoteDto.getSoId())
                        .orElseThrow(() -> new RuntimeException("Sales order not found with ID: " + issueNoteDto.getSoId()));
                issueNote.setSalesOrder(salesOrder);
                logger.debug("IssueNote is linked to SalesOrder ID: {}", issueNoteDto.getSoId());
            } else {
                logger.debug("IssueNote is not linked to any SalesOrder");
            }

            issueNote = issueNoteRepository.save(issueNote);

            for (IssueNoteDetailDTO detailDto : issueNoteDto.getDetails()) {
                logger.info("⏳ Processing export detail: {}", detailDto);

                if (detailDto.getWarehouseId() == null) {
                    throw new RuntimeException("warehouseId is required");
                }

                Warehouse warehouse = warehouseRepository.findById(detailDto.getWarehouseId())
                        .orElseThrow(() -> new RuntimeException("Warehouse not found with ID: " + detailDto.getWarehouseId()));

                GoodIssueDetail detail = GoodIssueDetail.builder()
                        .warehouse(warehouse)
                        .quantity(detailDto.getQuantity())
                        .goodIssueNote(issueNote)
                        .build();

                if (detailDto.getUnitId() != null) {
                    Unit unit = unitRepository.findById(detailDto.getUnitId())
                            .orElseThrow(() -> new RuntimeException("Unit not found with ID: " + detailDto.getUnitId()));
                    detail.setUnit(unit);
                }

                if (detailDto.getMaterialId() != null) {
                    Material material = materialRepository.findById(detailDto.getMaterialId())
                            .orElseThrow(() -> new RuntimeException("Material not found with ID: " + detailDto.getMaterialId()));
                    detail.setMaterial(material);
                    if (detail.getUnit() == null) {
                        detail.setUnit(material.getUnit());
                    }
                    updateInventoryAndTransactionForExport(warehouse, material, null, detailDto.getQuantity(), issueNote, hasSalesOrder);
                    // ✅ Thêm dòng này để kiểm tra tồn kho thấp
                    notificationService.checkLowStock(material.getMaterialId());
                } else if (detailDto.getProductId() != null) {
                    Product product = productRepository.findById(detailDto.getProductId())
                            .orElseThrow(() -> new RuntimeException("Product not found with ID: " + detailDto.getProductId()));
                    detail.setProduct(product);
                    if (detail.getUnit() == null) {
                        detail.setUnit(product.getUnit());
                    }
                    updateInventoryAndTransactionForExport(warehouse, null, product, detailDto.getQuantity(), issueNote, hasSalesOrder);
                } else {
                    throw new RuntimeException("Phải có thông tin về vật tư hoặc sản phẩm để xuất kho");
                }

                issueNote.getDetails().add(detail);
            }

            issueNoteDetailRepository.saveAll(issueNote.getDetails());

            if (hasSalesOrder) {
                SalesOrder salesOrder = issueNote.getSalesOrder();
                boolean isFirstIssuance = salesOrder.getStatus() != SalesOrder.OrderStatus.PARTIALLY_ISSUED &&
                        salesOrder.getStatus() != SalesOrder.OrderStatus.COMPLETED;

                if ("Sản xuất".equals(issueNoteDto.getCategory())) {
                    Map<Long, Double> materialExportQuantities = new HashMap<>();
                    for (IssueNoteDetailDTO detailDto : issueNoteDto.getDetails()) {
                        if (detailDto.getMaterialId() != null) {
                            materialExportQuantities.merge(
                                    detailDto.getMaterialId(),
                                    detailDto.getQuantity(),
                                    Double::sum
                            );
                        }
                    }
                    logger.debug("Material export quantities grouped by materialId: {}", materialExportQuantities);

                    List<SalesOrderMaterial> orderMaterials = salesOrder.getMaterials();
                    for (Map.Entry<Long, Double> entry : materialExportQuantities.entrySet()) {
                        Long materialId = entry.getKey();
                        double totalExport = entry.getValue();

                        SalesOrderMaterial salesOrderMaterial = orderMaterials.stream()
                                .filter(mat -> mat.getMaterial().getMaterialId().equals(materialId))
                                .findFirst()
                                .orElseThrow(() -> new RuntimeException("Sales order material not found for material ID: " + materialId));

                        int remainingQuantity = salesOrderMaterial.getRequiredQuantity() - salesOrderMaterial.getReceivedQuantity();
                        if (totalExport > remainingQuantity) {
                            throw new RuntimeException("Số lượng xuất vật tư ID " + materialId + " vượt quá số lượng cần: " + remainingQuantity);
                        }

                        salesOrderMaterial.setReceivedQuantity(salesOrderMaterial.getReceivedQuantity() + (int) totalExport);
                        logger.debug("Material ID {}: Updated receivedQuantity to {}", materialId, salesOrderMaterial.getReceivedQuantity());
                    }

                    boolean allMaterialsFulfilled = orderMaterials.stream()
                            .allMatch(mat -> mat.getReceivedQuantity() >= mat.getRequiredQuantity());
                    if (allMaterialsFulfilled) {
                        logger.debug("SalesOrder ID {} updated to COMPLETED (all materials fulfilled)", salesOrder.getOrderId());
                    } else if (isFirstIssuance) {

                        logger.debug("SalesOrder ID {} updated to PARTIALLY_ISSUED (first material issuance)", salesOrder.getOrderId());
                    }

                    salesOrderRepository.save(salesOrder);
                } else {
                    Map<Long, Integer> exportQuantities = new HashMap<>();
                    for (IssueNoteDetailDTO detailDto : issueNoteDto.getDetails()) {
                        if (detailDto.getProductId() != null) {
                            exportQuantities.merge(detailDto.getProductId(), detailDto.getQuantity().intValue(), Integer::sum);
                        }
                    }
                    logger.debug("Export quantities grouped by productId: {}", exportQuantities);

                    for (Map.Entry<Long, Integer> entry : exportQuantities.entrySet()) {
                        Long productId = entry.getKey();
                        int totalExport = entry.getValue();
                        SalesOrderDetail salesOrderDetail = salesOrder.getDetails().stream()
                                .filter(d -> d.getProduct().getProductId().equals(productId))
                                .findFirst()
                                .orElseThrow(() -> new RuntimeException("Sales order detail not found for product ID: " + productId));
                        logger.debug("Before update: SalesOrderDetail for product ID {} has receivedQuantity={}", productId, salesOrderDetail.getReceivedQuantity());
                        salesOrderDetail.setReceivedQuantity(salesOrderDetail.getReceivedQuantity() + totalExport);
                        logger.debug("After update: SalesOrderDetail for product ID {} has receivedQuantity={}", productId, salesOrderDetail.getReceivedQuantity());
                    }

                    boolean allProductsFulfilled = salesOrder.getDetails().stream()
                            .allMatch(detail -> detail.getReceivedQuantity() >= detail.getQuantity());
                    if (allProductsFulfilled) {
                        salesOrder.setStatus(SalesOrder.OrderStatus.COMPLETED);
                        logger.debug("SalesOrder ID {} updated to COMPLETED (all products fulfilled)", salesOrder.getOrderId());
                        List<SalesOrderDetail> orderDetails = salesOrder.getDetails();
                        for (SalesOrderDetail detail : orderDetails) {
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
                                logger.debug("Updated Inventory for Product ID {} in Warehouse ID {}: Added {} to AVAILABLE, salesOrder removed",
                                        product.getProductId(), warehouseId, releasedQuantity);
                                List<Inventory> reservedToDelete = reservedInventories.stream()
                                        .filter(inv -> inv.getWarehouse().getWarehouseId().equals(warehouseId))
                                        .toList();
                                inventoryRepository.deleteAll(reservedToDelete);
                                logger.debug("Deleted {} RESERVED Inventory records for Product ID {} in Warehouse ID {}",
                                        reservedToDelete.size(), product.getProductId(), warehouseId);
                            }
                            if (quantityToRelease > 0) {
                                logger.warn("Insufficient RESERVED inventory for Product ID {}: {} units remaining",
                                        product.getProductId(), quantityToRelease);
                            }
                        }
                    } else if (isFirstIssuance) {
                        salesOrder.setStatus(SalesOrder.OrderStatus.PARTIALLY_ISSUED);
                        logger.debug("SalesOrder ID {} updated to PARTIALLY_ISSUED (first issuance)", salesOrder.getOrderId());
                    }

                    salesOrderRepository.save(salesOrder);
                }
            }

            if ("Gia công".equals(issueNoteDto.getCategory())) {
                if (issueNoteDto.getPartnerId() == null) {
                    throw new RuntimeException("PartnerId is required for outsourcing");
                }
                ReceiveOutsource outsource = new ReceiveOutsource();
                outsource.setGoodIssueNote(issueNote);
                outsource.setPartner(Partner.builder().partnerId(issueNoteDto.getPartnerId()).build());
                outsource.setStatus(ReceiveOutsource.OutsourceStatus.PENDING);

                List<ReceiveOutsourceMaterial> outsourceMaterials = new ArrayList<>();
                if (issueNoteDto.getExpectedReturns() != null) {
                    for (IssueNoteDetailDTO expectedReturn : issueNoteDto.getExpectedReturns()) {
                        if (expectedReturn.getMaterialId() == null) {
                            throw new RuntimeException("MaterialId is required for expected return");
                        }

                        Material material = materialRepository.findById(expectedReturn.getMaterialId())
                                .orElseThrow(() -> new RuntimeException("Material not found with ID: " + expectedReturn.getMaterialId()));

                        ReceiveOutsourceMaterial rom = new ReceiveOutsourceMaterial();
                        rom.setReceiveOutsource(outsource);
                        rom.setMaterial(material);
                        rom.setQuantity(expectedReturn.getQuantity());
                        rom.setUnit(expectedReturn.getUnitId() != null
                                ? unitRepository.findById(expectedReturn.getUnitId())
                                .orElseThrow(() -> new RuntimeException("Unit not found with ID: " + expectedReturn.getUnitId()))
                                : material.getUnit());
                        outsourceMaterials.add(rom);
                    }
                }

                outsource.setMaterials(outsourceMaterials);
                receiveOutsourceRepository.save(outsource);
            }

            issueNote = issueNoteRepository.save(issueNote);
            return issueNoteMapper.toDTO(issueNote);
        } catch (Exception e) {
            logger.error("❌ Lỗi khi tạo phiếu xuất kho: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi lưu phiếu xuất: " + e.getMessage());
        }
    }

    private void updateInventoryAndTransactionForExport(Warehouse warehouse, Material material, Product product, Double quantity, GoodIssueNote issueNote, boolean hasSalesOrder) {
        Inventory inventory = null;
        SalesOrder salesOrder = hasSalesOrder ? issueNote.getSalesOrder() : null;

        if (material != null) {
            Inventory.InventoryStatus status = hasSalesOrder ? Inventory.InventoryStatus.RESERVED : Inventory.InventoryStatus.AVAILABLE;

            if (hasSalesOrder) {
                inventory = inventoryRepository.findByWarehouseAndMaterialAndStatusAndSalesOrder(warehouse, material, Inventory.InventoryStatus.RESERVED, salesOrder)
                        .filter(i -> i.getQuantity() >= quantity)
                        .orElse(null);
                logger.debug("Material [{}] - Warehouse [{}]: Tried RESERVED with SalesOrder [{}], found inventory = {}",
                        material.getMaterialId(), warehouse.getWarehouseId(), salesOrder != null ? salesOrder.getOrderId() : "null",
                        inventory != null ? inventory.getQuantity() : "null");
            }

            if (inventory == null) {
                inventory = inventoryRepository.findByWarehouseAndMaterialAndStatus(warehouse, material, Inventory.InventoryStatus.AVAILABLE)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy tồn kho AVAILABLE cho vật tư có ID: " + material.getMaterialId()));
                status = Inventory.InventoryStatus.AVAILABLE;
                logger.debug("Material [{}] - Warehouse [{}]: Fell back to AVAILABLE", material.getMaterialId(), warehouse.getWarehouseId());
            }

            if (inventory.getQuantity() < quantity) {
                throw new RuntimeException("Không đủ số lượng tồn kho " + status + " cho vật tư có ID: " + material.getMaterialId());
            }

            inventory.setQuantity(inventory.getQuantity() - quantity);
            inventory.setLastUpdated(issueNote.getIssueDate());
            if (status == Inventory.InventoryStatus.RESERVED && hasSalesOrder) {
                inventory.setSalesOrder(salesOrder);
            }
            inventoryRepository.save(inventory);
            logger.debug("Material [{}] - Warehouse [{}]: New inventory quantity = {}", material.getMaterialId(), warehouse.getWarehouseId(), inventory.getQuantity());

            InventoryTransaction transaction = InventoryTransaction.builder()
                    .warehouse(warehouse)
                    .material(material)
                    .transactionType(InventoryTransaction.TransactionType.EXPORT)
                    .quantity(quantity)
                    .goodIssueNote(issueNote)
                    .transactionDate(issueNote.getIssueDate())
                    .referenceType(InventoryTransaction.NoteType.GOOD_ISSUE_NOTE)
                    .build();
            inventoryTransactionRepository.save(transaction);
            logger.info("Created export transaction for material ID {}", material.getMaterialId());
        }

        if (product != null) {
            Inventory.InventoryStatus status = hasSalesOrder ? Inventory.InventoryStatus.RESERVED : Inventory.InventoryStatus.AVAILABLE;

            if (hasSalesOrder) {
                inventory = inventoryRepository.findByWarehouseAndProductAndStatusAndSalesOrder(warehouse, product, Inventory.InventoryStatus.RESERVED, salesOrder)
                        .filter(i -> i.getQuantity() >= quantity)
                        .orElse(null);
                logger.debug("Product [{}] - Warehouse [{}]: Tried RESERVED with SalesOrder [{}], found inventory = {}",
                        product.getProductId(), warehouse.getWarehouseId(), salesOrder != null ? salesOrder.getOrderId() : "null",
                        inventory != null ? inventory.getQuantity() : "null");
            }

            if (inventory == null) {
                inventory = inventoryRepository.findByWarehouseAndProductAndStatus(warehouse, product, Inventory.InventoryStatus.AVAILABLE)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy tồn kho AVAILABLE cho sản phẩm có ID: " + product.getProductId()));
                status = Inventory.InventoryStatus.AVAILABLE;
                logger.debug("Product [{}] - Warehouse [{}]: Fell back to AVAILABLE", product.getProductId(), warehouse.getWarehouseId());
            }

            if (inventory.getQuantity() < quantity) {
                throw new RuntimeException("Không đủ số lượng tồn kho " + status + " cho sản phẩm có ID: " + product.getProductId());
            }

            inventory.setQuantity(inventory.getQuantity() - quantity);
            inventory.setLastUpdated(LocalDateTime.now());
            if (status == Inventory.InventoryStatus.RESERVED && hasSalesOrder) {
                inventory.setSalesOrder(salesOrder);
            }
            inventoryRepository.save(inventory);
            logger.debug("Product [{}] - Warehouse [{}]: New inventory quantity = {}", product.getProductId(), warehouse.getWarehouseId(), inventory.getQuantity());

            InventoryTransaction transaction = InventoryTransaction.builder()
                    .warehouse(warehouse)
                    .product(product)
                    .transactionType(InventoryTransaction.TransactionType.EXPORT)
                    .quantity(quantity)
                    .goodIssueNote(issueNote)
                    .transactionDate(issueNote.getIssueDate())
                    .referenceType(InventoryTransaction.NoteType.GOOD_ISSUE_NOTE)
                    .build();
            inventoryTransactionRepository.save(transaction);
            logger.info("Created export transaction for product ID {}", product.getProductId());
        }
    }

    @Transactional
    public String getNextIssueCode() {
        try {
            Long maxId = issueNoteRepository.findMaxIssueNoteId();
            Long nextId = (maxId != null) ? (maxId + 1) : 1;
            return String.format("XK%05d", nextId);
        } catch (Exception e) {
            logger.error("Error generating next issue note code", e);
            throw new RuntimeException("Không thể tạo mã phiếu xuất mới: " + e.getMessage(), e);
        }
    }

    @Transactional
    public List<String> uploadPaperEvidence(Long noteId, String noteType, List<MultipartFile> files, User currentUser) {
        logger.info("Uploading {} files for issue note ID: {}, type: {}", files.size(), noteId, noteType);

        if ("GOOD_ISSUE_NOTE".equals(noteType)) {
            issueNoteRepository.findById(noteId)
                    .orElseThrow(() -> new RuntimeException("Phiếu xuất không tìm thấy với ID: " + noteId));
        }

        List<String> fileUrls = new ArrayList<>();
        try {
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    String fileUrl = azureBlobService.uploadFile(file);
                    PaperEvidence evidence = PaperEvidence.builder()
                            .noteId(noteId)
                            .noteType(PaperEvidence.NoteType.valueOf(noteType))
                            .paperUrl(fileUrl)
                            .build();
                    paperEvidenceRepository.save(evidence);
                    fileUrls.add(fileUrl);
                    logger.info("Successfully uploaded file: {} for note ID: {}", file.getOriginalFilename(), noteId);
                }
            }
            return fileUrls;
        } catch (Exception e) {
            logger.error("Error uploading files", e);
            throw new RuntimeException("Failed to upload files: " + e.getMessage(), e);
        }
    }

    public IssueNoteDTO getIssueNoteById(Long issueNoteId) {
        GoodIssueNote note = issueNoteRepository.findById(issueNoteId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu xuất với ID: " + issueNoteId));

        IssueNoteDTO dto = issueNoteMapper.toDTO(note);

        List<String> files = paperEvidenceRepository
                .findByNoteIdAndNoteType(note.getGinId(), PaperEvidence.NoteType.GOOD_ISSUE_NOTE)
                .stream()
                .map(PaperEvidence::getPaperUrl)
                .collect(Collectors.toList());
        dto.setPaperEvidence(files);

        receiveOutsourceRepository.findByGoodIssueNote_GinId(note.getGinId())
                .ifPresent(receiveOutsource -> {
                    ReceiveOutsourceDTO outsourceDTO = receiveOutsourceMapper.toDTO(receiveOutsource);
                    outsourceDTO.setMaterials(
                            receiveOutsource.getMaterials().stream()
                                    .map(receiveOutsourceMaterialMapper::toDTO)
                                    .toList()
                    );
                    dto.setReceiveOutsource(outsourceDTO);
                });

        return dto;
    }

    public Page<IssueNoteReportDTO> getFilteredExportReport(
            int page, int size,
            String search,
            LocalDate startDate,
            LocalDate endDate,
            String itemType,
            Double minQuantity,
            Double maxQuantity,
            List<String> categories,
            List<Long> warehouseIds
    ) {
        Pageable pageable = PageRequest.of(page, size);
        LocalDateTime startDateTime = (startDate != null) ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = (endDate != null) ? endDate.atTime(23, 59, 59) : null;

        return issueNoteDetailRepository.getFilteredExportReport(
                search, startDateTime, endDateTime, itemType, minQuantity, maxQuantity, categories, warehouseIds, pageable
        );
    }

    @Transactional(readOnly = true)
    public List<ReceiveOutsourceDTO> getPendingOrInProgressReceiveOutsource() {
        List<ReceiveOutsource> outsources = receiveOutsourceRepository.findByStatusIn(
                List.of(ReceiveOutsource.OutsourceStatus.PENDING, ReceiveOutsource.OutsourceStatus.IN_PROGRESS)
        );
        return outsources.stream()
                .map(outsource -> {
                    ReceiveOutsourceDTO dto = receiveOutsourceMapper.toDTO(outsource);
                    dto.setMaterials(
                            outsource.getMaterials().stream()
                                    .map(receiveOutsourceMaterialMapper::toDTO)
                                    .toList()
                    );
                    return dto;
                })
                .toList();
    }
}