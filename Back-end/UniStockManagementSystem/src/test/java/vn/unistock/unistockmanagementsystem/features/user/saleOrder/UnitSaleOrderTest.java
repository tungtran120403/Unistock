package vn.unistock.unistockmanagementsystem.features.user.saleOrder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.*;
import vn.unistock.unistockmanagementsystem.entities.*;
import vn.unistock.unistockmanagementsystem.features.user.inventory.InventoryRepository;
import vn.unistock.unistockmanagementsystem.features.user.partner.PartnerRepository;
import vn.unistock.unistockmanagementsystem.features.user.products.ProductsRepository;
import vn.unistock.unistockmanagementsystem.features.user.purchaseRequests.PurchaseRequestRepository;
import vn.unistock.unistockmanagementsystem.features.user.saleOrders.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

public class UnitSaleOrderTest {
    @InjectMocks
    private SaleOrdersService saleOrdersService;

    @Mock private SaleOrdersRepository saleOrdersRepository;
    @Mock private SaleOrdersMapper saleOrdersMapper;
    @Mock private PurchaseRequestRepository purchaseRequestRepository;
    @Mock private PartnerRepository partnerRepository;
    @Mock private ProductsRepository productsRepository;
    @Mock private InventoryRepository inventoryRepository;
    @Mock private SalesOrderMaterialRepository salesOrderMaterialRepository;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetNextOrderCode_NormalAndEdge() {
        when(saleOrdersRepository.findMaxOrderId()).thenReturn(0L);
        String code = saleOrdersService.getNextOrderCode();
        assertEquals("ĐH00001", code);
    }

    @Test
    void testGetOrderById_Found() {
        SalesOrder order = new SalesOrder();
        order.setOrderId(1L);
        SaleOrdersDTO dto = new SaleOrdersDTO();

        when(saleOrdersRepository.findById(1L)).thenReturn(Optional.of(order));
        when(saleOrdersMapper.toDTO(order)).thenReturn(dto);
        when(purchaseRequestRepository.findAllBySalesOrder_OrderId(1L)).thenReturn(Collections.emptyList());

        SaleOrdersDTO result = saleOrdersService.getOrderById(1L);
        assertNotNull(result);
    }

    @Test
    void testGetOrderById_NotFound() {
        when(saleOrdersRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> saleOrdersService.getOrderById(999L));
    }

    @Test
    void testCancelSalesOrder_NotFound() {
        when(saleOrdersRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> saleOrdersService.cancelSalesOrder(99L, "reason"));
    }

    @Test
    void testCancelSalesOrder_Success() {
        SalesOrder order = new SalesOrder();
        order.setDetails(new ArrayList<>());
        order.setMaterials(new ArrayList<>());

        when(saleOrdersRepository.findById(1L)).thenReturn(Optional.of(order));
        when(inventoryRepository.findByProductIdAndStatus(anyLong(), any())).thenReturn(new ArrayList<>());
        when(inventoryRepository.findByMaterialIdAndStatus(anyLong(), any())).thenReturn(new ArrayList<>());
        when(purchaseRequestRepository.findAllBySalesOrder_OrderId(1L)).thenReturn(new ArrayList<>());

        assertDoesNotThrow(() -> saleOrdersService.cancelSalesOrder(1L, "Test reason"));
    }

    @Test
    void testIsSaleOrderFullyIssuedMaterial_True() {
        SalesOrder order = new SalesOrder();
        order.setMaterials(new ArrayList<>());
        when(saleOrdersRepository.findById(1L)).thenReturn(Optional.of(order));

        boolean result = saleOrdersService.isSaleOrderFullyIssuedMaterial(1L);
        assertTrue(result);
    }

    @Test
    void testIsSaleOrderFullyIssuedMaterial_False() {
        SalesOrderMaterial material = new SalesOrderMaterial();
        material.setRequiredQuantity(10);
        material.setReceivedQuantity(5);
        SalesOrder order = new SalesOrder();
        order.setMaterials(List.of(material));

        when(saleOrdersRepository.findById(1L)).thenReturn(Optional.of(order));

        boolean result = saleOrdersService.isSaleOrderFullyIssuedMaterial(1L);
        assertFalse(result);
    }

    @Test
    void testSetPreparingMaterialStatus_OrderNotFound() {
        PrepareMaterialForSaleOrderDTO dto = new PrepareMaterialForSaleOrderDTO();
        dto.setSaleOrderId(100L);

        when(saleOrdersRepository.findById(100L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            saleOrdersService.setPreparingMaterialStatus(dto);
        });
        assertTrue(ex.getMessage().contains("Không tìm thấy đơn hàng"));
    }

    @Test
    void testSetPreparingMaterialStatus_Success() {
        PrepareMaterialForSaleOrderDTO dto = new PrepareMaterialForSaleOrderDTO();
        dto.setSaleOrderId(1L);
        dto.setUsedProductsFromWarehouses(new ArrayList<>());
        dto.setUsedMaterialsFromWarehouses(new ArrayList<>());

        SalesOrder order = new SalesOrder();
        order.setOrderId(1L);

        when(saleOrdersRepository.findById(1L)).thenReturn(Optional.of(order));

        assertDoesNotThrow(() -> saleOrdersService.setPreparingMaterialStatus(dto));
    }

    @Test
    void testGetNextOrderCode_NullMaxId() {
        when(saleOrdersRepository.findMaxOrderId()).thenReturn(null);
        String code = saleOrdersService.getNextOrderCode();
        assertEquals("ĐH00001", code);
    }
}
