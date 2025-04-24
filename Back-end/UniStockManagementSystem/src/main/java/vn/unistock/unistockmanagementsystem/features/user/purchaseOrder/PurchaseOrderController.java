package vn.unistock.unistockmanagementsystem.features.user.purchaseOrder;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.unistock.unistockmanagementsystem.features.user.saleOrders.SaleOrdersDTO;

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
    public ResponseEntity<Map<String, Object>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<PurchaseOrderDTO> orders = purchaseOrderService.getAllOrders(page, size);

        Map<String, Object> response = new HashMap<>();
        response.put("content", orders.getContent());
        response.put("totalPages", orders.getTotalPages());
        response.put("totalElements", orders.getTotalElements());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrderDTO> getOrderById(@PathVariable Long id) {
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
