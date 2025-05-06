package vn.unistock.unistockmanagementsystem.features.user.purchaseOrder;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import vn.unistock.unistockmanagementsystem.entities.*;
import vn.unistock.unistockmanagementsystem.features.user.materials.MaterialsRepository;
import vn.unistock.unistockmanagementsystem.features.user.partner.PartnerRepository;
import vn.unistock.unistockmanagementsystem.features.user.purchaseRequests.PurchaseRequestService;
import vn.unistock.unistockmanagementsystem.features.user.saleOrders.SaleOrdersDTO;
import vn.unistock.unistockmanagementsystem.features.user.saleOrders.SaleOrdersMapper;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private SaleOrdersMapper saleOrdersMapper;

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderDetailRepository purchaseOrderDetailRepository;
    private final PurchaseOrderMapper purchaseOrderMapper;
    private final PurchaseOrderDetailMapper purchaseOrderDetailMapper;

    private final PartnerRepository partnerRepository;
    private final MaterialsRepository materialRepository;
    @Autowired
    private PurchaseRequestService purchaseRequestService;


    public Page<PurchaseOrderDTO> getAllOrders(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "poId"));
        Page<PurchaseOrder> orders = purchaseOrderRepository.findAll(pageable);

        orders.map(order -> PurchaseOrderDTO.builder()
                .poId(order.getPoId())
                .poCode(order.getPoCode())
                .purchaseRequestCode(order.getPurchaseRequest() != null ? order.getPurchaseRequest().getPurchaseRequestCode() : null)
                .supplierId(order.getPartner() != null ? order.getPartner().getPartnerId() : null)
                .supplierName(order.getPartner() != null ? order.getPartner().getPartnerName() : null)
                .supplierContactName(order.getPartner() != null ? order.getPartner().getContactName() : null)
                .supplierPhone(order.getPartner() != null ? order.getPartner().getPhone() : null)
                .supplierAddress(order.getPartner() != null ? order.getPartner().getAddress() : null)
                .orderDate(order.getOrderDate())
                .status(order.getStatus().getLabel())
                .build());

        return orders.map(purchaseOrderMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public PurchaseOrderDTO getOrderById(Long id) {
        // Sử dụng native query để lấy đầy đủ thông tin
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase order not found"));

        // Tạo DTO trực tiếp thay vì dùng MapStruct
        PurchaseOrderDTO orderDTO = new PurchaseOrderDTO();
        orderDTO.setPoId(order.getPoId());
        orderDTO.setPoCode(order.getPoCode());
        orderDTO.setOrderDate(order.getOrderDate());
        orderDTO.setStatus(order.getStatus().name());

        if (order.getPartner() != null) {
            orderDTO.setSupplierId(order.getPartner().getPartnerId());
            orderDTO.setSupplierName(order.getPartner().getPartnerName());
            orderDTO.setSupplierAddress(order.getPartner().getAddress());
            orderDTO.setSupplierPhone(order.getPartner().getPhone());
            orderDTO.setSupplierContactName(order.getPartner().getContactName());
        }

        // Tải chi tiết đơn hàng từ repository riêng biệt với join fetch
        String jpql = "SELECT d FROM PurchaseOrderDetail d " +
                "JOIN FETCH d.material m " +
                "LEFT JOIN FETCH m.unit u " +
                "LEFT JOIN FETCH m.materialType mt " +
                "WHERE d.purchaseOrder.poId = :poId";

        List<PurchaseOrderDetail> details = entityManager.createQuery(jpql, PurchaseOrderDetail.class)
                .setParameter("poId", id)
                .getResultList();

        // Chuyển đổi detail thành DetailDTO
        List<PurchaseOrderDetailDTO> detailDTOs = new ArrayList<>();
        for (PurchaseOrderDetail detail : details) {
            PurchaseOrderDetailDTO detailDTO = new PurchaseOrderDetailDTO();
            detailDTO.setPoDetailId(detail.getPoDetailId());
            detailDTO.setOrderedQuantity(detail.getOrderedQuantity());
            detailDTO.setReceivedQuantity(detail.getReceivedQuantity());
            detailDTO.setRemainingQuantity(detail.getRemainingQuantity());

            Material material = detail.getMaterial();
            if (material != null) {
                detailDTO.setMaterialId(material.getMaterialId());
                detailDTO.setMaterialCode(material.getMaterialCode());
                detailDTO.setMaterialName(material.getMaterialName());
                if (material.getUnit() != null) {
                    detailDTO.setUnit(material.getUnit().getUnitName());
                }
            }

            detailDTOs.add(detailDTO);
        }

        orderDTO.setDetails(detailDTOs);

        // Log để debug
        System.out.println("Order DTO created with ID: " + orderDTO.getPoId());
        System.out.println("Details count: " + detailDTOs.size());
        detailDTOs.forEach(d -> {
            System.out.println("Detail ID: " + d.getPoDetailId() +
                    ", Material ID: " + d.getMaterialId() +
                    ", Material Name: " + d.getMaterialName() +
                    ", Material Unit: " + d.getUnit());
        });

        return orderDTO;
    }

    @Transactional
    public PurchaseOrderDTO createOrder(PurchaseOrderDTO dto) {
        PurchaseOrder order = purchaseOrderMapper.toEntity(dto);
        order = purchaseOrderRepository.save(order);
        return purchaseOrderMapper.toDTO(order);
    }

    /**
     * Tạo nhiều purchase orders theo nhà cung cấp từ một yêu cầu mua hàng
     */
    @Transactional
    public List<PurchaseOrderDTO> createMultipleOrders(PurchaseRequestDTO request) {
        // Nhóm các mặt hàng theo nhà cung cấp
        Map<Long, List<PurchaseRequestItemDTO>> supplierItemsMap = request.getItems().stream()
                .collect(Collectors.groupingBy(PurchaseRequestItemDTO::getSupplierId));

        List<PurchaseOrderDTO> result = new ArrayList<>();

        // Tạo purchase order cho mỗi nhà cung cấp
        for (Map.Entry<Long, List<PurchaseRequestItemDTO>> entry : supplierItemsMap.entrySet()) {
            Long supplierId = entry.getKey();
            List<PurchaseRequestItemDTO> items = entry.getValue();

            // Tìm thông tin nhà cung cấp
            Partner supplier = partnerRepository.findById(supplierId)
                    .orElseThrow(() -> new RuntimeException("Supplier not found with ID: " + supplierId));

            // Tạo purchase order
            PurchaseOrder order = new PurchaseOrder();
            order.setPartner(supplier);
            order.setOrderDate(LocalDateTime.now());
            order.setPoCode(generatePurchaseOrderCode(supplier));

            if (request.getPurchaseRequestId() != null) {
                PurchaseRequest purchaseRequest = new PurchaseRequest();
                purchaseRequest.setPurchaseRequestId(request.getPurchaseRequestId());
                order.setPurchaseRequest(purchaseRequest);
            }


            // Lưu purchase order
            order = purchaseOrderRepository.save(order);

            // Tạo chi tiết cho purchase order
            List<PurchaseOrderDetail> details = new ArrayList<>();
            for (PurchaseRequestItemDTO item : items) {
                Material material = materialRepository.findById(item.getMaterialId())
                        .orElseThrow(() -> new RuntimeException("Material not found with ID: " + item.getMaterialId()));

                PurchaseOrderDetail detail = new PurchaseOrderDetail();
                detail.setPurchaseOrder(order);
                detail.setMaterial(material);
                detail.setOrderedQuantity(item.getQuantity());
                detail.setRemainingQuantity(item.getQuantity());
                detail.setReceivedQuantity(0); // Ban đầu chưa nhận hàng

                details.add(detail);
            }
            if (request.getPurchaseRequestId() != null) {
                purchaseRequestService.markRequestAsPurchased(request.getPurchaseRequestId());
            }

            // Lưu tất cả chi tiết
            purchaseOrderDetailRepository.saveAll(details);

            // Lấy đầy đủ thông tin sau khi lưu
            PurchaseOrderDTO savedOrderDTO = getOrderById(order.getPoId());
            result.add(savedOrderDTO);
        }

        return result;
    }

    /**
     * Tạo mã purchase order
     */
    private String generatePurchaseOrderCode(Partner supplier) {
        String prefix = "MH";

        // Tìm mã đơn hàng lớn nhất trong hệ thống
        String maxPoCodeQuery = "SELECT MAX(p.poCode) FROM PurchaseOrder p WHERE p.poCode LIKE :prefix";
        String maxPoCode = entityManager.createQuery(maxPoCodeQuery, String.class)
                .setParameter("prefix", prefix + "%")
                .getSingleResult();

        int nextNumber = 1;
        if (maxPoCode != null) {
            // Trích xuất số từ mã đơn hàng lớn nhất
            try {
                String numberStr = maxPoCode.substring(prefix.length());
                nextNumber = Integer.parseInt(numberStr) + 1;
            } catch (Exception e) {
                // Nếu có lỗi trong quá trình parse, sử dụng giá trị mặc định là 1
                nextNumber = 1;
            }
        }

        // Format số thành chuỗi có độ dài 5 ký tự, thêm số 0 vào đầu nếu cần
        String numberStr = String.format("%05d", nextNumber);

        return prefix + numberStr;
    }

    public SaleOrdersDTO getSaleOrderFromPurchaseOrder(Long poId) {
        SalesOrder salesOrder = purchaseOrderRepository
                .findSalesOrderByPurchaseOrderId(poId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy đơn hàng bán liên kết với PurchaseOrder ID: " + poId
                ));

        return saleOrdersMapper.toDTO(salesOrder);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderDTO> getPendingOrInProgressOrders() {
        List<PurchaseOrder> orders = purchaseOrderRepository.findPendingOrInProgressOrders();
        return orders.stream()
                .map(PurchaseOrderDTO::createForList)
                .toList();
    }

    public Page<PurchaseOrderDTO> getAllOrdersFiltered(int page, int size, String search, String status, LocalDateTime startDate, LocalDateTime endDate) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "orderDate"));
        PurchaseOrder.OrderStatus orderStatus = null;
        if (status != null && !status.trim().isEmpty()) {
            try {
                orderStatus = PurchaseOrder.OrderStatus.valueOf(status);
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status value: " + status);
            }
        }
        Page<PurchaseOrder> orders = purchaseOrderRepository.searchFilteredOrders(
                search, orderStatus, startDate, endDate, pageable
        );
        return orders.map(purchaseOrderMapper::toDTO);
    }

    public SalesOrder getSaleOrderEntityFromPurchaseOrder(Long poId) {
        return purchaseOrderRepository.findSalesOrderByPurchaseOrderId(poId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy đơn hàng bán liên kết với PurchaseOrder ID: " + poId
                ));
    }

}