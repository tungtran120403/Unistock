package vn.unistock.unistockmanagementsystem.features.user.purchaseOrder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.web.server.ResponseStatusException;
import vn.unistock.unistockmanagementsystem.entities.*;
import vn.unistock.unistockmanagementsystem.features.user.materials.MaterialsRepository;
import vn.unistock.unistockmanagementsystem.features.user.partner.PartnerRepository;
import vn.unistock.unistockmanagementsystem.features.user.purchaseRequests.PurchaseRequestService;
import vn.unistock.unistockmanagementsystem.features.user.saleOrders.SaleOrdersDTO;
import vn.unistock.unistockmanagementsystem.features.user.saleOrders.SaleOrdersMapper;

import java.time.LocalDateTime;
import java.util.*;

@ExtendWith(MockitoExtension.class)
public class PurchaseOrderUnitTest {
    @Mock
    private EntityManager entityManager;

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private PurchaseOrderDetailRepository purchaseOrderDetailRepository;

    @Mock
    private PurchaseOrderMapper purchaseOrderMapper;

    @Mock
    private PurchaseOrderDetailMapper purchaseOrderDetailMapper;

    @Mock
    private PartnerRepository partnerRepository;

    @Mock
    private MaterialsRepository materialRepository;

    @Mock
    private PurchaseRequestService purchaseRequestService;

    @Mock
    private SaleOrdersMapper saleOrdersMapper;

    @Mock
    private TypedQuery<PurchaseOrderDetail> detailQuery;

    @Mock
    private TypedQuery<String> stringQuery;

    @InjectMocks
    private PurchaseOrderService purchaseOrderService;

    private PurchaseOrder testPurchaseOrder;
    private PurchaseOrderDTO testPurchaseOrderDTO;
    private Partner testPartner;
    private Material testMaterial;
    private PurchaseOrderDetail testDetail;
    private List<PurchaseOrderDetail> detailsList;
    private Unit testUnit;
    private MaterialType testMaterialType;

    @BeforeEach
    void setUp() {
        // Setup common test data
        testPartner = new Partner();
        testPartner.setPartnerId(1L);
        testPartner.setPartnerName("Test Supplier");
        testPartner.setContactName("Contact Person");
        testPartner.setPhone("123456789");
        testPartner.setAddress("Test Address");

        testUnit = new Unit();
        testUnit.setUnitId(1L);
        testUnit.setUnitName("kg");

        testMaterialType = new MaterialType();
        testMaterialType.setMaterialTypeId(1L);
        testMaterialType.setName("Raw Material");

        testMaterial = new Material();
        testMaterial.setMaterialId(1L);
        testMaterial.setMaterialCode("MAT001");
        testMaterial.setMaterialName("Test Material");
        testMaterial.setUnit(testUnit);
        testMaterial.setMaterialType(testMaterialType);

        // Create test purchase order
        testPurchaseOrder = new PurchaseOrder();
        testPurchaseOrder.setPoId(1L);
        testPurchaseOrder.setPoCode("MH00001");
        testPurchaseOrder.setPartner(testPartner);
        testPurchaseOrder.setOrderDate(LocalDateTime.now());
        testPurchaseOrder.setStatus(PurchaseOrder.OrderStatus.PENDING);

        PurchaseRequest testPurchaseRequest = new PurchaseRequest();
        testPurchaseRequest.setPurchaseRequestId(1L);
        testPurchaseRequest.setPurchaseRequestCode("PR00001");
        testPurchaseOrder.setPurchaseRequest(testPurchaseRequest);

        // Create test detail
        testDetail = new PurchaseOrderDetail();
        testDetail.setPoDetailId(1L);
        testDetail.setPurchaseOrder(testPurchaseOrder);
        testDetail.setMaterial(testMaterial);
        testDetail.setOrderedQuantity(10);
        testDetail.setReceivedQuantity(0);
        testDetail.setRemainingQuantity(10);

        detailsList = new ArrayList<>();
        detailsList.add(testDetail);

        // Create DTO
        testPurchaseOrderDTO = new PurchaseOrderDTO();
        testPurchaseOrderDTO.setPoId(1L);
        testPurchaseOrderDTO.setPoCode("MH00001");
        testPurchaseOrderDTO.setSupplierId(1L);
        testPurchaseOrderDTO.setSupplierName("Test Supplier");
        testPurchaseOrderDTO.setSupplierContactName("Contact Person");
        testPurchaseOrderDTO.setSupplierPhone("123456789");
        testPurchaseOrderDTO.setSupplierAddress("Test Address");
        testPurchaseOrderDTO.setOrderDate(testPurchaseOrder.getOrderDate());
        testPurchaseOrderDTO.setStatus(PurchaseOrder.OrderStatus.PENDING.name());
        testPurchaseOrderDTO.setPurchaseRequestCode("PR00001");
        testPurchaseOrderDTO.setPurchaseRequestId(1L);
    }

    @Test
    void testGetAllOrders_Normal() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        List<PurchaseOrder> purchaseOrders = List.of(testPurchaseOrder);
        Page<PurchaseOrder> orderPage = new PageImpl<>(purchaseOrders, pageable, purchaseOrders.size());

        when(purchaseOrderRepository.findAll(any(Pageable.class))).thenReturn(orderPage);
        when(purchaseOrderMapper.toDTO(any(PurchaseOrder.class))).thenReturn(testPurchaseOrderDTO);

        // Act
        Page<PurchaseOrderDTO> result = purchaseOrderService.getAllOrders(0, 10);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(testPurchaseOrderDTO, result.getContent().get(0));
        verify(purchaseOrderRepository).findAll(any(Pageable.class));
        verify(purchaseOrderMapper).toDTO(testPurchaseOrder);
    }
        @Test
        void testGetOrderById_NotFound () {
            // Arrange
            when(purchaseOrderRepository.findById(99L)).thenReturn(Optional.empty());

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                purchaseOrderService.getOrderById(99L);
            });

            assertEquals("Purchase order not found", exception.getMessage());
            verify(purchaseOrderRepository).findById(99L);
        }

        @Test
        void testCreateOrder () {
            // Arrange
            when(purchaseOrderMapper.toEntity(testPurchaseOrderDTO)).thenReturn(testPurchaseOrder);
            when(purchaseOrderRepository.save(testPurchaseOrder)).thenReturn(testPurchaseOrder);
            when(purchaseOrderMapper.toDTO(testPurchaseOrder)).thenReturn(testPurchaseOrderDTO);

            // Act
            PurchaseOrderDTO result = purchaseOrderService.createOrder(testPurchaseOrderDTO);

            // Assert
            assertNotNull(result);
            assertEquals(testPurchaseOrderDTO, result);
            verify(purchaseOrderMapper).toEntity(testPurchaseOrderDTO);
            verify(purchaseOrderRepository).save(testPurchaseOrder);
            verify(purchaseOrderMapper).toDTO(testPurchaseOrder);
        }

        @Test
        void testCreateMultipleOrders_EmptyItems () {
            // Arrange - Create request with no items
            PurchaseRequestDTO requestDTO = new PurchaseRequestDTO();
            requestDTO.setPurchaseRequestId(1L);
            requestDTO.setItems(new ArrayList<>());

            // Act
            List<PurchaseOrderDTO> result = purchaseOrderService.createMultipleOrders(requestDTO);

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());
            verify(partnerRepository, never()).findById(anyLong());
            verify(materialRepository, never()).findById(anyLong());
            verify(purchaseOrderRepository, never()).save(any(PurchaseOrder.class));
            verify(purchaseOrderDetailRepository, never()).saveAll(anyList());
            verify(purchaseRequestService, never()).markRequestAsPurchased(anyLong());
        }

        @Test
        void testCreateMultipleOrders_SupplierNotFound () {
            // Arrange
            PurchaseRequestDTO requestDTO = new PurchaseRequestDTO();
            requestDTO.setPurchaseRequestId(1L);

            PurchaseRequestItemDTO itemDTO = new PurchaseRequestItemDTO();
            itemDTO.setSupplierId(999L); // Non-existent supplier ID
            itemDTO.setMaterialId(1L);
            itemDTO.setQuantity(10);

            requestDTO.setItems(List.of(itemDTO));

            when(partnerRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                purchaseOrderService.createMultipleOrders(requestDTO);
            });

            assertTrue(exception.getMessage().contains("Supplier not found"));
            verify(partnerRepository).findById(999L);
            verify(purchaseOrderRepository, never()).save(any(PurchaseOrder.class));
        }

        @Test
        void testGetSaleOrderFromPurchaseOrder_NotFound () {
            // Arrange
            when(purchaseOrderRepository.findSalesOrderByPurchaseOrderId(99L)).thenReturn(Optional.empty());

            // Act & Assert
            ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
                purchaseOrderService.getSaleOrderFromPurchaseOrder(99L);
            });

            assertTrue(exception.getMessage().contains("Không tìm thấy đơn hàng bán liên kết"));
            verify(purchaseOrderRepository).findSalesOrderByPurchaseOrderId(99L);
        }
        @Test
        void testGetPendingOrInProgressOrders () {
            // Arrange
            List<PurchaseOrder> orders = List.of(testPurchaseOrder);
            when(purchaseOrderRepository.findPendingOrInProgressOrders()).thenReturn(orders);

            // Act
            List<PurchaseOrderDTO> result = purchaseOrderService.getPendingOrInProgressOrders();

            // Assert
            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals(testPurchaseOrder.getPoId(), result.get(0).getPoId());
            verify(purchaseOrderRepository).findPendingOrInProgressOrders();
        }

        @Test
        void testGetAllOrdersFiltered () {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            List<PurchaseOrder> purchaseOrders = List.of(testPurchaseOrder);
            Page<PurchaseOrder> orderPage = new PageImpl<>(purchaseOrders, pageable, purchaseOrders.size());

            LocalDateTime startDate = LocalDateTime.now().minusDays(7);
            LocalDateTime endDate = LocalDateTime.now();

            when(purchaseOrderRepository.searchFilteredOrders(
                    eq("test"),
                    eq(PurchaseOrder.OrderStatus.PENDING),
                    eq(startDate),
                    eq(endDate),
                    any(Pageable.class)
            )).thenReturn(orderPage);

            when(purchaseOrderMapper.toDTO(any(PurchaseOrder.class))).thenReturn(testPurchaseOrderDTO);

            // Act
            Page<PurchaseOrderDTO> result = purchaseOrderService.getAllOrdersFiltered(
                    0, 10, "test", "PENDING", startDate, endDate
            );

            // Assert
            assertNotNull(result);
            assertEquals(1, result.getTotalElements());
            assertEquals(testPurchaseOrderDTO, result.getContent().get(0));

            verify(purchaseOrderRepository).searchFilteredOrders(
                    eq("test"),
                    eq(PurchaseOrder.OrderStatus.PENDING),
                    eq(startDate),
                    eq(endDate),
                    any(Pageable.class)
            );
            verify(purchaseOrderMapper).toDTO(testPurchaseOrder);
        }

        @Test
        void testGetAllOrdersFiltered_InvalidStatus () {
            // Act & Assert
            ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
                purchaseOrderService.getAllOrdersFiltered(0, 10, "test", "INVALID_STATUS", null, null);
            });

            assertTrue(exception.getMessage().contains("Invalid status value"));
        }

        @Test
        void testGetAllOrdersFiltered_EmptyStatus () {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            List<PurchaseOrder> purchaseOrders = List.of(testPurchaseOrder);
            Page<PurchaseOrder> orderPage = new PageImpl<>(purchaseOrders, pageable, purchaseOrders.size());

            when(purchaseOrderRepository.searchFilteredOrders(
                    eq("test"),
                    isNull(),
                    isNull(),
                    isNull(),
                    any(Pageable.class)
            )).thenReturn(orderPage);

            when(purchaseOrderMapper.toDTO(any(PurchaseOrder.class))).thenReturn(testPurchaseOrderDTO);

            // Act - Empty string should be handled same as null
            Page<PurchaseOrderDTO> result = purchaseOrderService.getAllOrdersFiltered(
                    0, 10, "test", "", null, null
            );

            // Assert
            assertNotNull(result);
            assertEquals(1, result.getTotalElements());
            verify(purchaseOrderRepository).searchFilteredOrders(
                    eq("test"),
                    isNull(),
                    isNull(),
                    isNull(),
                    any(Pageable.class)
            );
        }

        @Test
        void testGetAllOrdersFiltered_NegativePagination () {
            // Act & Assert - Testing with negative page number
            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
                purchaseOrderService.getAllOrdersFiltered(-1, 10, null, null, null, null);
            });

            // Spring's PageRequest throws this exception for negative values
            assertTrue(exception.getMessage().contains("Page index must not be less than zero"));
        }

        @Test
        void testGetAllOrdersFiltered_ZeroPageSize () {
            // Act & Assert - Testing with zero page size
            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
                purchaseOrderService.getAllOrdersFiltered(0, 0, null, null, null, null);
            });

            // Spring's PageRequest throws this exception for zero page size
            assertTrue(exception.getMessage().contains("Page size must not be less than one"));
        }

        @Test
        void testGetSaleOrderEntityFromPurchaseOrder () {
            // Arrange
            SalesOrder salesOrder = new SalesOrder();
            salesOrder.setOrderId(1L);

            when(purchaseOrderRepository.findSalesOrderByPurchaseOrderId(1L)).thenReturn(Optional.of(salesOrder));

            // Act
            SalesOrder result = purchaseOrderService.getSaleOrderEntityFromPurchaseOrder(1L);

            // Assert
            assertNotNull(result);
            assertEquals(1L, result.getOrderId());
            verify(purchaseOrderRepository).findSalesOrderByPurchaseOrderId(1L);
        }

        @Test
        void testGetSaleOrderEntityFromPurchaseOrder_NotFound () {
            // Arrange
            when(purchaseOrderRepository.findSalesOrderByPurchaseOrderId(99L)).thenReturn(Optional.empty());

            // Act & Assert
            ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
                purchaseOrderService.getSaleOrderEntityFromPurchaseOrder(99L);
            });

            assertTrue(exception.getMessage().contains("Không tìm thấy đơn hàng bán liên kết"));
            verify(purchaseOrderRepository).findSalesOrderByPurchaseOrderId(99L);
        }
    }
