package vn.unistock.unistockmanagementsystem.features.user.purchaseRequests;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/unistock/user/purchase-requests")
@RequiredArgsConstructor
public class PurchaseRequestController {
    private final PurchaseRequestService purchaseRequestService;

    @GetMapping
    public ResponseEntity<Page<PurchaseRequestDTO>> getAllPurchaseRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PurchaseRequestDTO> requests = purchaseRequestService.getAllPurchaseRequests(pageable);
        return ResponseEntity.ok(requests);
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
    public ResponseEntity<PurchaseRequestDTO> updateStatus(
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