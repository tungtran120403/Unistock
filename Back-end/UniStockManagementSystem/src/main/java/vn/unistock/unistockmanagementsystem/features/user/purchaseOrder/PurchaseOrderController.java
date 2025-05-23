package vn.unistock.unistockmanagementsystem.features.user.purchaseOrder;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.unistock.unistockmanagementsystem.features.user.saleOrders.SaleOrdersDTO;

import java.time.LocalDateTime;
import java.util.HashMap;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/unistock/user/purchases")
@RequiredArgsConstructor
public class PurchaseOrderController {
    @Autowired
    private final PurchaseOrderService purchaseOrderService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllOrdersFiltered(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate

            ) {
        Page<PurchaseOrderDTO> orders = purchaseOrderService.getAllOrdersFiltered(page, size, search, status, startDate, endDate);
        Map<String, Object> response = new HashMap<>();
        response.put("content", orders.getContent());
        response.put("totalPages", orders.getTotalPages());
        response.put("totalElements", orders.getTotalElements());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrderDTO> getPurchaseOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseOrderService.getOrderById(id));
    }

    @PostMapping()
    public ResponseEntity<Map<String, Object>> createMultipleOrders(@RequestBody PurchaseRequestDTO requestDTO) {
        List<PurchaseOrderDTO> createdOrders = purchaseOrderService.createMultipleOrders(requestDTO);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Created " + createdOrders.size() + " purchase orders successfully");
        response.put("orders", createdOrders);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{poId}/sale-order")
    public ResponseEntity<SaleOrdersDTO> getSaleOrderByPurchaseOrder(@PathVariable Long poId) {
        SaleOrdersDTO dto = purchaseOrderService.getSaleOrderFromPurchaseOrder(poId);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/filter/status")
    public ResponseEntity<List<PurchaseOrderDTO>> getPendingOrInProgressOrders() {
        List<PurchaseOrderDTO> orders = purchaseOrderService.getPendingOrInProgressOrders();
        return ResponseEntity.ok(orders);
    }

}
