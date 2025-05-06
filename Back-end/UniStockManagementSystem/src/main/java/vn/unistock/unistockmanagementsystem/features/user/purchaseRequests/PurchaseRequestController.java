package vn.unistock.unistockmanagementsystem.features.user.purchaseRequests;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.unistock.unistockmanagementsystem.entities.PurchaseRequest;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/unistock/user/purchase-requests")
@RequiredArgsConstructor
public class PurchaseRequestController {
    private final PurchaseRequestService purchaseRequestService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllPurchaseRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) List<PurchaseRequest.RequestStatus> statuses
    ) {
        Page<PurchaseRequestDTO> requests = purchaseRequestService.getFilteredPurchaseRequests(
                page, size, search, startDate, endDate, statuses
        );

        Map<String, Object> response = new HashMap<>();
        response.put("content", requests.getContent());
        response.put("totalPages", requests.getTotalPages());
        response.put("totalElements", requests.getTotalElements());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/next-code")
    public ResponseEntity<String> getNextRequestCode() {
        String nextCode = purchaseRequestService.getNextRequestCode();
        return ResponseEntity.ok(nextCode);
    }

    @GetMapping("/{purchaseRequestId}")
    public ResponseEntity<PurchaseRequestDTO> getPurchaseRequestById(@PathVariable Long purchaseRequestId) {
        PurchaseRequestDTO request = purchaseRequestService.getPurchaseRequestById(purchaseRequestId);
        return ResponseEntity.ok(request);
    }

    @PostMapping("/manual")
    public ResponseEntity<PurchaseRequestDTO> createManualPurchaseRequest(@RequestBody PurchaseRequestDTO dto) {
        PurchaseRequestDTO response = purchaseRequestService.createManualPurchaseRequest(dto);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{purchaseRequestId}/status")
    public ResponseEntity<PurchaseRequestDTO> updatePurchaseRequestStatus(
            @PathVariable Long purchaseRequestId,
            @RequestBody UpdateStatusRequestDTO request) {
        PurchaseRequestDTO updatedRequest =
                purchaseRequestService.updatePurchaseRequestStatus(purchaseRequestId, request.getStatus(), request.getRejectionReason());
        return ResponseEntity.ok(updatedRequest);
    }




//    @PostMapping("/sale-order/{saleOrderId}")
//    public ResponseEntity<PurchaseRequestDTO> createFromSaleOrder(@PathVariable Long saleOrderId) {
//        PurchaseRequestDTO purchaseRequestDTO = purchaseRequestService.createFromSaleOrder(saleOrderId);
//        return ResponseEntity.status(HttpStatus.CREATED).body(purchaseRequestDTO);
//    }


    @GetMapping("/can-create-purchase-request/{orderId}")
    public ResponseEntity<Boolean> canCreatePurchaseRequest(@PathVariable Long orderId) {
        boolean canCreate = purchaseRequestService.canCreatePurchaseRequest(orderId);
        return ResponseEntity.ok(canCreate);
    }

}