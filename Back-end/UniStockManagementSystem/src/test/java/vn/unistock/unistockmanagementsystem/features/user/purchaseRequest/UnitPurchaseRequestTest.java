package vn.unistock.unistockmanagementsystem.features.user.purchaseRequest;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.*;
import org.springframework.web.server.ResponseStatusException;
import vn.unistock.unistockmanagementsystem.entities.*;
import vn.unistock.unistockmanagementsystem.features.user.inventory.InventoryRepository;
import vn.unistock.unistockmanagementsystem.features.user.materials.MaterialsRepository;
import vn.unistock.unistockmanagementsystem.features.user.partner.PartnerRepository;
import vn.unistock.unistockmanagementsystem.features.user.purchaseRequests.*;
import vn.unistock.unistockmanagementsystem.features.user.saleOrders.SaleOrdersRepository;

import java.util.*;
public class UnitPurchaseRequestTest {
    @InjectMocks
    private PurchaseRequestService purchaseRequestService;

    @Mock private PurchaseRequestRepository purchaseRequestRepository;
    @Mock private PurchaseRequestMapper purchaseRequestMapper;
    @Mock private InventoryRepository inventoryRepository;
    @Mock private MaterialsRepository materialRepository;
    @Mock private PartnerRepository partnerRepository;
    @Mock private SaleOrdersRepository saleOrdersRepository;
    @Mock private PurchaseRequestDetailMapper purchaseRequestDetailMapper;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetAllPurchaseRequests_Normal() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<PurchaseRequest> page = new PageImpl<>(List.of(new PurchaseRequest()));

        when(purchaseRequestRepository.findAll(pageable)).thenReturn(page);
        when(purchaseRequestMapper.toDTO(any())).thenReturn(new PurchaseRequestDTO());

        Page<PurchaseRequestDTO> result = purchaseRequestService.getAllPurchaseRequests(pageable);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void testGetPurchaseRequestById_Found() {
        PurchaseRequest pr = new PurchaseRequest();
        pr.setPurchaseRequestDetails(new ArrayList<>());

        when(purchaseRequestRepository.findById(1L)).thenReturn(Optional.of(pr));
        when(purchaseRequestMapper.toDTO(pr)).thenReturn(new PurchaseRequestDTO());

        PurchaseRequestDTO result = purchaseRequestService.getPurchaseRequestById(1L);
        assertNotNull(result);
    }

    @Test
    void testGetPurchaseRequestById_NotFound() {
        when(purchaseRequestRepository.findById(999L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            purchaseRequestService.getPurchaseRequestById(999L);
        });
        assertEquals(404, ex.getStatusCode().value());
    }

    @Test
    void testGetNextRequestCode_Normal() {
        when(purchaseRequestRepository.findMaxPurchaseRequestId()).thenReturn(5L);
        String code = purchaseRequestService.getNextRequestCode();
        assertEquals("YC00006", code);
    }

    @Test
    void testGetNextRequestCode_Empty() {
        when(purchaseRequestRepository.findMaxPurchaseRequestId()).thenReturn(null);
        String code = purchaseRequestService.getNextRequestCode();
        assertEquals("YC00001", code);
    }

    @Test
    void testUpdatePurchaseRequestStatus_NotFound() {
        when(purchaseRequestRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> purchaseRequestService.updatePurchaseRequestStatus(999L, "CONFIRMED", null));
    }

    @Test
    void testCanCreatePurchaseRequest_NoExistingRequests() {
        when(purchaseRequestRepository.findAllBySalesOrder_OrderId(1L)).thenReturn(Collections.emptyList());
        assertTrue(purchaseRequestService.canCreatePurchaseRequest(1L));
    }

    @Test
    void testCanCreatePurchaseRequest_AllCancelled() {
        PurchaseRequest pr = new PurchaseRequest();
        pr.setStatus(PurchaseRequest.RequestStatus.CANCELLED);

        when(purchaseRequestRepository.findAllBySalesOrder_OrderId(1L)).thenReturn(List.of(pr));
        assertTrue(purchaseRequestService.canCreatePurchaseRequest(1L));
    }

    @Test
    void testCanCreatePurchaseRequest_ActiveExists() {
        PurchaseRequest pr = new PurchaseRequest();
        pr.setStatus(PurchaseRequest.RequestStatus.PENDING);

        when(purchaseRequestRepository.findAllBySalesOrder_OrderId(1L)).thenReturn(List.of(pr));
        assertFalse(purchaseRequestService.canCreatePurchaseRequest(1L));
    }

    @Test
    void testUpdatePurchaseRequestStatus_Success() {
        PurchaseRequest pr = new PurchaseRequest();
        when(purchaseRequestRepository.findById(1L)).thenReturn(Optional.of(pr));

        assertDoesNotThrow(() -> purchaseRequestService.updatePurchaseRequestStatus(1L, "CONFIRMED", null));
        assertEquals(PurchaseRequest.RequestStatus.CONFIRMED, pr.getStatus());
    }

    @Test
    void testGetAllPurchaseRequests_Empty() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<PurchaseRequest> emptyPage = new PageImpl<>(Collections.emptyList());

        when(purchaseRequestRepository.findAll(pageable)).thenReturn(emptyPage);

        Page<PurchaseRequestDTO> result = purchaseRequestService.getAllPurchaseRequests(pageable);
        assertTrue(result.isEmpty());
    }

    @Test
    void testUpdatePurchaseRequestStatus_InvalidStatus() {
        PurchaseRequest pr = new PurchaseRequest();
        when(purchaseRequestRepository.findById(1L)).thenReturn(Optional.of(pr));

        assertThrows(IllegalArgumentException.class, () -> purchaseRequestService.updatePurchaseRequestStatus(1L, "INVALID_STATUS", null));
    }

    @Test
    void testGetNextRequestCode_Exception() {
        when(purchaseRequestRepository.findMaxPurchaseRequestId()).thenThrow(new RuntimeException("DB error"));
        assertThrows(RuntimeException.class, () -> purchaseRequestService.getNextRequestCode());
    }

    @Test
    void testCanCreatePurchaseRequest_MixedStatuses() {
        PurchaseRequest pr1 = new PurchaseRequest();
        pr1.setStatus(PurchaseRequest.RequestStatus.CANCELLED);
        PurchaseRequest pr2 = new PurchaseRequest();
        pr2.setStatus(PurchaseRequest.RequestStatus.CONFIRMED);

        when(purchaseRequestRepository.findAllBySalesOrder_OrderId(1L)).thenReturn(List.of(pr1, pr2));
        boolean result = purchaseRequestService.canCreatePurchaseRequest(1L);
        assertFalse(result);
    }

}
