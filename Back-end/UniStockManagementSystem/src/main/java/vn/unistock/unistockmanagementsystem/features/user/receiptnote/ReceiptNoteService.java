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
import vn.unistock.unistockmanagementsystem.features.user.materials.MaterialsRepository;
import vn.unistock.unistockmanagementsystem.features.user.products.ProductsRepository;
import vn.unistock.unistockmanagementsystem.features.user.purchaseOrder.PurchaseOrderDTO;
import vn.unistock.unistockmanagementsystem.features.user.purchaseOrder.PurchaseOrderDetailRepository;
import vn.unistock.unistockmanagementsystem.features.user.purchaseOrder.PurchaseOrderRepository;
import vn.unistock.unistockmanagementsystem.features.user.purchaseOrder.PurchaseOrderService;
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

    public Page<ReceiptNoteDTO> getAllReceiptNote(int page, int size, String search, List<String> categories, String startDate, String endDate) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "receiptDate"));

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

            GoodReceiptNote grn = GoodReceiptNote.builder()
                    .grnCode(grnDto.getGrnCode())
                    .description(grnDto.getDescription())
                    .category(grnDto.getCategory())
                    .receiptDate(grnDto.getReceiptDate())
                    .createdBy(currentUser)
                    .details(new ArrayList<>())
                    .build();

            // Lưu đối tác nếu nhập hàng bán bị trả lại
            if (grnDto.getPartnerId() != null) {
                Partner partner = Partner.builder().partnerId(grnDto.getPartnerId()).build();
                grn.setPartner(partner);
            }

            // Kiểm tra liên kết với SalesOrder qua PurchaseOrder
            boolean hasSaleOrder = false;
            if (grnDto.getPoId() != null) {
                PurchaseOrder po = purchaseOrderRepository.findById(grnDto.getPoId())
                        .orElseThrow(() -> new RuntimeException("Purchase order not found with ID: " + grnDto.getPoId()));
                grn.setPurchaseOrder(po);
                try {
                    purchaseOrderService.getSaleOrderFromPurchaseOrder(po.getPoId());
                    hasSaleOrder = true;
                    logger.debug("PurchaseOrder ID {} is linked to a SalesOrder, setting hasSaleOrder = true", po.getPoId());
                } catch (Exception ignored) {
                    logger.debug("PurchaseOrder ID {} is not linked to a SalesOrder, hasSaleOrder = false", po.getPoId());
                }
            }

            grn = receiptNoteRepository.save(grn);
            List<GoodReceiptDetail> details = new ArrayList<>();

            for (ReceiptNoteDetailDTO detailDto : grnDto.getDetails()) {
                logger.info("⏳ Processing detail: {}", detailDto);

                if (detailDto.getWarehouseId() == null) {
                    throw new RuntimeException("warehouseId is required");
                }

                Warehouse warehouse = warehouseRepository.findById(detailDto.getWarehouseId())
                        .orElseThrow(() -> new RuntimeException("Warehouse not found with ID: " + detailDto.getWarehouseId()));

                GoodReceiptDetail detail = GoodReceiptDetail.builder()
                        .warehouse(warehouse)
                        .quantity(detailDto.getQuantity())
                        .goodReceiptNote(grn)
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
                    if (detail.getUnit() == null) detail.setUnit(material.getUnit());
                    updateInventoryAndTransaction(warehouse, material, null, detailDto.getQuantity(), hasSaleOrder, grn);

                    // Cập nhật PurchaseOrderDetail nếu có poId
                    if (grnDto.getPoId() != null) {
                        PurchaseOrderDetail pod = purchaseOrderDetailRepository.findByPurchaseOrderPoId(grnDto.getPoId()).stream()
                                .filter(d -> d.getMaterial().getMaterialId().equals(detailDto.getMaterialId()))
                                .findFirst()
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy dòng đơn hàng ứng với vật tư ID: " + detailDto.getMaterialId()));
                        pod.setReceivedQuantity(pod.getReceivedQuantity() + detailDto.getQuantity().intValue());
                        purchaseOrderDetailRepository.save(pod);
                    }
                } else if (detailDto.getProductId() != null) {
                    Product product = productRepository.findById(detailDto.getProductId())
                            .orElseThrow(() -> new RuntimeException("Product not found with ID: " + detailDto.getProductId()));
                    detail.setProduct(product);
                    if (detail.getUnit() == null) detail.setUnit(product.getUnit());
                    updateInventoryAndTransaction(warehouse, null, product, detailDto.getQuantity(), hasSaleOrder, grn);
                } else {
                    throw new RuntimeException("Chi tiết phiếu phải có sản phẩm hoặc vật tư.");
                }
                details.add(detail);
            }

            goodReceiptDetailRepository.saveAll(details);

            // Cập nhật trạng thái PurchaseOrder nếu có
            if (grnDto.getPoId() != null) {
                List<PurchaseOrderDetail> poDetails = purchaseOrderDetailRepository.findByPurchaseOrderPoId(grnDto.getPoId());
                boolean allReceived = poDetails.stream()
                        .allMatch(detail -> detail.getOrderedQuantity() - detail.getReceivedQuantity() <= 0);
                PurchaseOrder po = poDetails.get(0).getPurchaseOrder();
                po.setStatus(allReceived ? PurchaseOrder.OrderStatus.COMPLETED : PurchaseOrder.OrderStatus.IN_PROGRESS);
                purchaseOrderRepository.save(po);
            }

            return receiptNoteMapper.toDTO(grn);
        } catch (Exception e) {
            logger.error("❌ Lỗi khi tạo phiếu nhập kho: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi lưu phiếu nhập: " + e.getMessage());
        }
    }

    private void updateInventoryAndTransaction(Warehouse warehouse, Material material, Product product, Double quantity, boolean hasSaleOrder, GoodReceiptNote grn) {
        Inventory inventory = null;

        if (material != null) {
            // Xác định status cho material dựa trên hasSaleOrder
            Inventory.InventoryStatus status = hasSaleOrder ? Inventory.InventoryStatus.RESERVED : Inventory.InventoryStatus.AVAILABLE;

            // Sử dụng phương thức mới với status
            inventory = inventoryRepository.findByWarehouseAndMaterialAndStatus(warehouse, material, status)
                    .orElse(null);
            if (inventory == null) {
                inventory = Inventory.builder()
                        .warehouse(warehouse)
                        .material(material)
                        .status(status)
                        .quantity(0.0)
                        .build();
            }
            inventory.setQuantity(inventory.getQuantity() + quantity);
            inventory.setLastUpdated(LocalDateTime.now());
            inventoryRepository.save(inventory);

            InventoryTransaction transaction = InventoryTransaction.builder()
                    .warehouse(warehouse)
                    .material(material)
                    .transactionType(InventoryTransaction.TransactionType.IMPORT)
                    .quantity(quantity)
                    .goodReceiptNote(grn)
                    .referenceType(InventoryTransaction.NoteType.GOOD_RECEIPT_NOTE)
                    .build();
            inventoryTransactionRepository.save(transaction);
        }

        if (product != null) {
            // Luôn sử dụng status = AVAILABLE cho product
            Inventory.InventoryStatus status = Inventory.InventoryStatus.AVAILABLE;

            // Sử dụng phương thức mới với status
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

            InventoryTransaction transaction = InventoryTransaction.builder()
                    .warehouse(warehouse)
                    .product(product)
                    .transactionType(InventoryTransaction.TransactionType.IMPORT)
                    .quantity(quantity)
                    .goodReceiptNote(grn)
                    .referenceType(InventoryTransaction.NoteType.GOOD_RECEIPT_NOTE)
                    .build();
            inventoryTransactionRepository.save(transaction);
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
        List<ReceiptNoteDetailViewDTO> all = detailRepository.getReceiptImportReportRaw();

        return new PageImpl<>(
                all.stream()
                        .filter(dto -> search == null || search.isBlank()
                                || (dto.getProductCode() != null && dto.getProductCode().toLowerCase().contains(search.toLowerCase()))
                                || (dto.getProductName() != null && dto.getProductName().toLowerCase().contains(search.toLowerCase()))
                                || (dto.getMaterialCode() != null && dto.getMaterialCode().toLowerCase().contains(search.toLowerCase()))
                                || (dto.getMaterialName() != null && dto.getMaterialName().toLowerCase().contains(search.toLowerCase()))
                                || (dto.getGrnCode() != null && dto.getGrnCode().toLowerCase().contains(search.toLowerCase()))
                        )
                        .filter(dto -> itemType == null || itemType.isBlank()
                                || itemType.equalsIgnoreCase(dto.getItemType())
                        )
                        .filter(dto -> !"UNKNOWN".equals(dto.getItemType()))
                        .filter(dto -> warehouseIds == null || warehouseIds.isEmpty() || warehouseIds.contains(dto.getWarehouseId()))
                        .filter(dto -> categories == null || categories.isEmpty() || categories.contains(dto.getCategory()))
                        .filter(dto -> {
                            if (dto.getReceiptDate() == null) return false;
                            if (startDateStr != null && !startDateStr.isBlank()) {
                                LocalDateTime start = LocalDateTime.parse(startDateStr + "T00:00:00");
                                if (dto.getReceiptDate().isBefore(start)) return false;
                            }
                            if (endDateStr != null && !endDateStr.isBlank()) {
                                LocalDateTime end = LocalDateTime.parse(endDateStr + "T23:59:59");
                                if (dto.getReceiptDate().isAfter(end)) return false;
                            }
                            return true;
                        })
                        .filter(dto -> minQuantity == null || dto.getQuantity() >= minQuantity)
                        .filter(dto -> maxQuantity == null || dto.getQuantity() <= maxQuantity)
                        .toList()
                , pageable, all.size());
    }

}
