package vn.unistock.unistockmanagementsystem.features.user.receiptnote;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import vn.unistock.unistockmanagementsystem.entities.*;
import vn.unistock.unistockmanagementsystem.features.admin.user.UserRepository;
import vn.unistock.unistockmanagementsystem.features.user.inventory.InventoryRepository;
import vn.unistock.unistockmanagementsystem.features.user.inventory.InventoryTransactionRepository;
import vn.unistock.unistockmanagementsystem.features.user.issueNote.ReceiveOutsourceRepository;
import vn.unistock.unistockmanagementsystem.features.user.materials.MaterialsRepository;
import vn.unistock.unistockmanagementsystem.features.user.notification.NotificationService;
import vn.unistock.unistockmanagementsystem.features.user.products.ProductsRepository;
import vn.unistock.unistockmanagementsystem.features.user.purchaseOrder.PurchaseOrderDTO;
import vn.unistock.unistockmanagementsystem.features.user.purchaseOrder.PurchaseOrderDetailRepository;
import vn.unistock.unistockmanagementsystem.features.user.purchaseOrder.PurchaseOrderRepository;
import vn.unistock.unistockmanagementsystem.features.user.purchaseOrder.PurchaseOrderService;
import vn.unistock.unistockmanagementsystem.features.user.saleOrders.SaleOrdersService;
import vn.unistock.unistockmanagementsystem.features.user.units.UnitRepository;
import vn.unistock.unistockmanagementsystem.features.user.warehouse.WarehouseRepository;
import vn.unistock.unistockmanagementsystem.security.filter.CustomUserDetails;
import vn.unistock.unistockmanagementsystem.utils.storage.AzureBlobService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReceiptNoteService {
    private static final Logger logger = LoggerFactory.getLogger(ReceiptNoteService.class);

    @Autowired private ReceiptNoteDetailRepository goodReceiptDetailRepository;
    @Autowired private InventoryRepository inventoryRepository;
    @Autowired private InventoryTransactionRepository inventoryTransactionRepository;
    @Autowired private WarehouseRepository warehouseRepository;
    @Autowired private MaterialsRepository materialRepository;
    @Autowired private ProductsRepository productRepository;
    @Autowired private ReceiptNoteRepository receiptNoteRepository;
    @Autowired private ReceiptNoteMapper receiptNoteMapper;
    @Autowired private PaperEvidenceRepository paperEvidenceRepository;
    @Autowired private AzureBlobService azureBlobService;
    @Autowired private UnitRepository unitRepository;
    @Autowired private PurchaseOrderRepository purchaseOrderRepository;
    @Autowired private PurchaseOrderService purchaseOrderService;
    @Autowired private ReceiptNoteDetailViewMapper detailViewMapper;
    @Autowired private PurchaseOrderDetailRepository purchaseOrderDetailRepository;
    @Autowired private ReceiptNoteDetailRepository detailRepository;
    @Autowired
    private ReceiveOutsourceRepository receiveOutsourceRepository;
    @Autowired
    private SaleOrdersService saleOrdersService;
    @Autowired
    private NotificationService notificationService;

    public Page<ReceiptNoteDTO> getAllReceiptNote(int page, int size, String search, List<String> categories, String startDate, String endDate) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "grnId"));

        // Xử lý khoảng thời gian
        LocalDateTime start = startDate != null && !startDate.isBlank() ? LocalDateTime.parse(startDate + "T00:00:00") : null;
        LocalDateTime end = endDate != null && !endDate.isBlank() ? LocalDateTime.parse(endDate + "T23:59:59") : null;

        // Gọi repository với các tiêu chí lọc
        Page<GoodReceiptNote> notes = receiptNoteRepository.findByFilters(
                search, categories, start, end, pageable
        );

        return notes.map(receiptNoteMapper::toDTO);
    }

    public ReceiptNoteDTO getAllReceiptNoteById(Long receiptNoteId) {
        GoodReceiptNote note = receiptNoteRepository.findById(receiptNoteId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu nhập với ID: " + receiptNoteId));

        ReceiptNoteDTO dto = receiptNoteMapper.toDTO(note);

        // Gán danh sách detail đã map view
        List<ReceiptNoteDetailViewDTO> viewDetails = note.getDetails().stream()
                .map(detailViewMapper::toViewDTO)
                .collect(Collectors.toList());
        dto.setDetails((List) viewDetails);

        // Gán file đính kèm
        List<String> files = paperEvidenceRepository
                .findByNoteIdAndNoteType(receiptNoteId, PaperEvidence.NoteType.GOOD_RECEIPT_NOTE)
                .stream()
                .map(PaperEvidence::getPaperUrl)
                .collect(Collectors.toList());
        dto.setPaperEvidence(files);

        return dto;
    }


    @Transactional
    public ReceiptNoteDTO createGoodReceipt(ReceiptNoteDTO grnDto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }

        try {
            CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
            User currentUser = userDetails.getUser();

            // Validate payload
            if (grnDto.getDetails() == null || grnDto.getDetails().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phiếu nhập phải có ít nhất một chi tiết hàng hóa");
            }

            // Khởi tạo GoodReceiptNote
            GoodReceiptNote grn = GoodReceiptNote.builder()
                    .grnCode(grnDto.getGrnCode())
                    .description(grnDto.getDescription())
                    .category(grnDto.getCategory())
                    .receiptDate(grnDto.getReceiptDate())
                    .createdBy(currentUser)
                    .details(new ArrayList<>())
                    .build();

            // Lưu đối tác nếu có
            if (grnDto.getPartnerId() != null) {
                Partner partner = Partner.builder().partnerId(grnDto.getPartnerId()).build();
                grn.setPartner(partner);
            }

            // Kiểm tra và lưu PurchaseOrder hoặc ReceiveOutsource
            PurchaseOrder linkedPurchaseOrder = null;
            ReceiveOutsource linkedOutsource = null;
            boolean hasSaleOrder = false;
            boolean saleOrderCompleted = false;
            SalesOrder linkedSaleOrder = null;

            if (grnDto.getPoId() != null) {
                if ("Vật tư mua bán".equals(grnDto.getCategory())) {
                    linkedPurchaseOrder = purchaseOrderRepository.findById(grnDto.getPoId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn mua không tồn tại với ID: " + grnDto.getPoId()));
                    grn.setPurchaseOrder(linkedPurchaseOrder);
                    try {
                        linkedSaleOrder = purchaseOrderService.getSaleOrderEntityFromPurchaseOrder(linkedPurchaseOrder.getPoId());
                        hasSaleOrder = true;
                        saleOrderCompleted = linkedSaleOrder.getStatus() == SalesOrder.OrderStatus.COMPLETED
                                || saleOrdersService.isSaleOrderFullyIssuedMaterial(linkedSaleOrder.getOrderId());
                        logger.debug("PurchaseOrder ID {} linked to SalesOrder ID {}, saleOrderCompleted={}",
                                linkedPurchaseOrder.getPoId(), linkedSaleOrder.getOrderId(), saleOrderCompleted);
                    } catch (Exception ignored) {
                        logger.debug("PurchaseOrder ID {} not linked to any SalesOrder", linkedPurchaseOrder.getPoId());
                    }
                } else if ("Hàng hóa gia công".equals(grnDto.getCategory())) {
                    if ("Hàng hóa gia công".equals(grnDto.getCategory())) {
                        linkedOutsource = receiveOutsourceRepository.findByGoodIssueNote_GinId(grnDto.getPoId())
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn gia công không tồn tại với GIN ID: " + grnDto.getPoId()));
                        grn.setGoodIssueNote(linkedOutsource.getGoodIssueNote());
                    }

                } else {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại phiếu nhập không hợp lệ với poId");
                }
            }

            // Lưu GoodReceiptNote
            grn = receiptNoteRepository.save(grn);
            List<GoodReceiptDetail> details = new ArrayList<>();

            // Xử lý chi tiết phiếu nhập
            for (ReceiptNoteDetailDTO detailDto : grnDto.getDetails()) {
                logger.info("⏳ Processing detail: {}", detailDto);

                // Validate warehouse
                if (detailDto.getWarehouseId() == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "warehouseId is required");
                }
                Warehouse warehouse = warehouseRepository.findById(detailDto.getWarehouseId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Warehouse not found with ID: " + detailDto.getWarehouseId()));

                // Khởi tạo GoodReceiptDetail
                GoodReceiptDetail detail = GoodReceiptDetail.builder()
                        .warehouse(warehouse)
                        .quantity(detailDto.getQuantity())
                        .goodReceiptNote(grn)
                        .build();

                // Xử lý unit
                if (detailDto.getUnitId() != null) {
                    Unit unit = unitRepository.findById(detailDto.getUnitId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unit not found with ID: " + detailDto.getUnitId()));
                    detail.setUnit(unit);
                }

                // Xử lý material hoặc product
                if (detailDto.getMaterialId() != null) {
                    Material material = materialRepository.findById(detailDto.getMaterialId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Material not found with ID: " + detailDto.getMaterialId()));
                    detail.setMaterial(material);
                    if (detail.getUnit() == null) detail.setUnit(material.getUnit());
                    updateInventoryAndTransaction(warehouse, material, null, detailDto.getQuantity(), hasSaleOrder, saleOrderCompleted, linkedSaleOrder, grn);

                    notificationService.clearLowStockNotificationIfRecovered(material.getMaterialId());

                    // Xử lý Vật tư mua bán
                    if ("Vật tư mua bán".equals(grnDto.getCategory()) && linkedPurchaseOrder != null) {
                        List<PurchaseOrderDetail> poDetails = purchaseOrderDetailRepository.findByPurchaseOrderPoId(grnDto.getPoId());
                        if (poDetails.isEmpty()) {
                            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy chi tiết đơn mua cho ID: " + grnDto.getPoId());
                        }
                        PurchaseOrderDetail pod = poDetails.stream()
                                .filter(d -> d.getMaterial().getMaterialId().equals(detailDto.getMaterialId()))
                                .findFirst()
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy dòng đơn hàng ứng với vật tư ID: " + detailDto.getMaterialId()));
                        pod.setReceivedQuantity(pod.getReceivedQuantity() + detailDto.getQuantity().intValue());
                        purchaseOrderDetailRepository.save(pod);
                    }

                    // Xử lý Hàng hóa gia công
                    if ("Hàng hóa gia công".equals(grnDto.getCategory()) && linkedOutsource != null) {
                        ReceiveOutsourceMaterial materialDetail = linkedOutsource.getMaterials().stream()
                                .filter(m -> m.getMaterial().getMaterialId().equals(detailDto.getMaterialId()))
                                .findFirst()
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy vật tư trong đơn gia công với ID: " + detailDto.getMaterialId()));
                        double newReceived = (materialDetail.getReceivedQuantity() != null ? materialDetail.getReceivedQuantity() : 0) + detailDto.getQuantity();
                        materialDetail.setReceivedQuantity(newReceived);
                        materialDetail.setRemainingQuantity(materialDetail.getQuantity() - newReceived);
                        receiveOutsourceRepository.save(linkedOutsource);
                    }

                } else if (detailDto.getProductId() != null) {
                    Product product = productRepository.findById(detailDto.getProductId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product not found with ID: " + detailDto.getProductId()));
                    detail.setProduct(product);
                    if (detail.getUnit() == null) detail.setUnit(product.getUnit());
                    updateInventoryAndTransaction(warehouse, null, product, detailDto.getQuantity(), hasSaleOrder, saleOrderCompleted, linkedSaleOrder, grn);
                } else {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chi tiết phiếu phải có sản phẩm hoặc vật tư");
                }
                details.add(detail);
            }

            // Lưu chi tiết phiếu nhập
            goodReceiptDetailRepository.saveAll(details);

            // Cập nhật trạng thái PurchaseOrder hoặc ReceiveOutsource
            if (grnDto.getPoId() != null) {
                if ("Vật tư mua bán".equals(grnDto.getCategory()) && linkedPurchaseOrder != null) {
                    List<PurchaseOrderDetail> poDetails = purchaseOrderDetailRepository.findByPurchaseOrderPoId(grnDto.getPoId());
                    if (poDetails.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy chi tiết đơn mua cho ID: " + grnDto.getPoId());
                    }
                    boolean allReceived = poDetails.stream()
                            .allMatch(detail -> detail.getOrderedQuantity() - detail.getReceivedQuantity() <= 0);
                    linkedPurchaseOrder.setStatus(allReceived ? PurchaseOrder.OrderStatus.COMPLETED : PurchaseOrder.OrderStatus.IN_PROGRESS);
                    purchaseOrderRepository.save(linkedPurchaseOrder);
                } else if ("Hàng hóa gia công".equals(grnDto.getCategory()) && linkedOutsource != null) {
                    boolean allReceived = linkedOutsource.getMaterials().stream()
                            .allMatch(m -> m.getRemainingQuantity() == null || m.getRemainingQuantity() <= 0);
                    linkedOutsource.setStatus(allReceived ? ReceiveOutsource.OutsourceStatus.COMPLETED : ReceiveOutsource.OutsourceStatus.IN_PROGRESS);
                    receiveOutsourceRepository.save(linkedOutsource);
                }
            }

            return receiptNoteMapper.toDTO(grn);
        } catch (Exception e) {
            logger.error("❌ Lỗi khi tạo phiếu nhập kho: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi lưu phiếu nhập: " + e.getMessage());
        }
    }

    private void updateInventoryAndTransaction(
            Warehouse warehouse,
            Material material,
            Product product,
            Double quantity,
            boolean hasSaleOrder,
            boolean saleOrderCompleted,
            SalesOrder linkedSaleOrder,
            GoodReceiptNote grn) {
        Inventory inventory;

        if (material != null) {
            Inventory.InventoryStatus status;
            SalesOrder salesOrder = null;

            if (hasSaleOrder) {
                if (saleOrderCompleted) {
                    status = Inventory.InventoryStatus.AVAILABLE;
                } else {
                    status = Inventory.InventoryStatus.RESERVED;
                    salesOrder = linkedSaleOrder;
                }
            } else {
                status = Inventory.InventoryStatus.AVAILABLE;
            }

            inventory = inventoryRepository.findByWarehouseAndMaterialAndStatusAndSalesOrder(warehouse, material, status, salesOrder)
                    .orElse(null);

            if (inventory == null) {
                inventory = Inventory.builder()
                        .warehouse(warehouse)
                        .material(material)
                        .status(status)
                        .salesOrder(salesOrder)
                        .quantity(0.0)
                        .build();
            }

            inventory.setQuantity(inventory.getQuantity() + quantity);
            inventory.setLastUpdated(grn.getReceiptDate());
            inventoryRepository.save(inventory);

            inventoryTransactionRepository.save(InventoryTransaction.builder()
                    .warehouse(warehouse)
                    .material(material)
                    .transactionType(InventoryTransaction.TransactionType.IMPORT)
                    .quantity(quantity)
                    .goodReceiptNote(grn)
                    .transactionDate(grn.getReceiptDate())
                    .referenceType(InventoryTransaction.NoteType.GOOD_RECEIPT_NOTE)
                    .build());
        }

        if (product != null) {
            Inventory.InventoryStatus status = Inventory.InventoryStatus.AVAILABLE;

            inventory = inventoryRepository.findByWarehouseAndProductAndStatus(warehouse, product, status)
                    .orElse(null);
            if (inventory == null) {
                inventory = Inventory.builder()
                        .warehouse(warehouse)
                        .product(product)
                        .status(status)
                        .quantity(0.0)
                        .build();
            }

            inventory.setQuantity(inventory.getQuantity() + quantity);
            inventory.setLastUpdated(LocalDateTime.now());
            inventoryRepository.save(inventory);

            inventoryTransactionRepository.save(InventoryTransaction.builder()
                    .warehouse(warehouse)
                    .product(product)
                    .transactionType(InventoryTransaction.TransactionType.IMPORT)
                    .quantity(quantity)
                    .goodReceiptNote(grn)
                    .transactionDate(grn.getReceiptDate())
                    .referenceType(InventoryTransaction.NoteType.GOOD_RECEIPT_NOTE)
                    .build());
        }
    }

    @Transactional
    public String getNextReceiptCode() {
        try {
            Long maxId = receiptNoteRepository.findMaxGoodReceiptNoteId();
            Long nextId = (maxId != null) ? (maxId + 1) : 1;
            return String.format("NK%05d", nextId);
        } catch (Exception e) {
            logger.error("Error generating next receipt note code", e);
            throw new RuntimeException("Không thể tạo mã phiếu nhập mới: " + e.getMessage(), e);
        }
    }

    @Transactional
    public List<String> uploadPaperEvidence(Long noteId, String noteType, List<MultipartFile> files, User currentUser) {
        logger.info("Uploading {} files for note ID: {}, type: {}", files.size(), noteId, noteType);

        if (noteType.equals("GOOD_RECEIPT_NOTE")) {
            receiptNoteRepository.findById(noteId)
                    .orElseThrow(() -> new RuntimeException("Receipt Note not found with ID: " + noteId));
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

    public Page<ReceiptNoteDetailViewDTO> getImportReportPaginated(
            int page,
            int size,
            String search,
            String itemType,
            List<Long> warehouseIds,
            String startDateStr,
            String endDateStr,
            List<String> categories,
            Double minQuantity,
            Double maxQuantity
    ) {
        Pageable pageable = PageRequest.of(page, size);
        LocalDateTime start = (startDateStr != null && !startDateStr.isBlank()) ? LocalDateTime.parse(startDateStr + "T00:00:00") : null;
        LocalDateTime end = (endDateStr != null && !endDateStr.isBlank()) ? LocalDateTime.parse(endDateStr + "T23:59:59") : null;

        return detailRepository.getFilteredImportReport(
                search,
                start,
                end,
                itemType,
                minQuantity,
                maxQuantity,
                categories,
                warehouseIds,
                pageable
        );
    }
}
