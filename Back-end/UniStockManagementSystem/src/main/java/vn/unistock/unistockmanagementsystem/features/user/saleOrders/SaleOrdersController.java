package vn.unistock.unistockmanagementsystem.features.user.saleOrders;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.unistock.unistockmanagementsystem.entities.SalesOrder;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/unistock/user/sale-orders")
@RequiredArgsConstructor
public class SaleOrdersController {

    private final SaleOrdersService saleOrdersService;


    @GetMapping
    public ResponseEntity<Page<SaleOrdersDTO>> getFilteredOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String orderCode,
            @RequestParam(required = false) String partnerName,
            @RequestParam(required = false) List<SalesOrder.OrderStatus> statuses,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date endDate) {
        return ResponseEntity.ok(saleOrdersService.getFilteredOrders(orderCode, partnerName, statuses, startDate, endDate, page, size));
    }

    @GetMapping("/next-code")
    public ResponseEntity<String> getNextOrderCode() {
        String nextCode = saleOrdersService.getNextOrderCode();
        return ResponseEntity.ok(nextCode);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<SaleOrdersDTO> getOrderById(@PathVariable Long orderId) {
        SaleOrdersDTO order = saleOrdersService.getOrderById(orderId);
        System.out.println("📝 Kiểm tra dữ liệu trả về: " + order);
        return ResponseEntity.ok(order);
    }

    @PostMapping
    public ResponseEntity<SaleOrdersDTO> createSaleOrder(@RequestBody SaleOrdersDTO saleOrdersDTO) {
        SaleOrdersDTO createdOrder = saleOrdersService.createSaleOrder(saleOrdersDTO);
        return new ResponseEntity<>(createdOrder, HttpStatus.CREATED);
    }

    @PutMapping("/{orderId}")
    public ResponseEntity<SaleOrdersDTO> updateSaleOrder(
            @PathVariable Long orderId,
            @RequestBody SaleOrdersDTO saleOrdersDTO
    ) {
        // Gọi service để cập nhật
        SaleOrdersDTO updatedOrder = saleOrdersService.updateSaleOrder(orderId, saleOrdersDTO);
        return ResponseEntity.ok(updatedOrder);
    }

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<?> cancelSaleOrder(
            @PathVariable Long orderId,
            @RequestBody CancelOrderRequest request
    ) {
        try {
            saleOrdersService.cancelSalesOrder(orderId, request.getRejectionReason());
            return ResponseEntity.ok("Đơn hàng đã được huỷ.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Không thể huỷ đơn hàng: " + e.getMessage());
        }
    }

    @PutMapping("/{orderId}/set-preparing")
    public ResponseEntity<?> setPreparingMaterial(
            @PathVariable Long orderId,
            @RequestBody PrepareMaterialForSaleOrderDTO request
    ) {
        request.setSaleOrderId(orderId); // Gán thủ công nếu cần xử lý bên trong service
        saleOrdersService.setPreparingMaterialStatus(request);
        return ResponseEntity.ok("Đơn hàng đã chuyển sang trạng thái 'Đang chuẩn bị vật tư'.");
    }



}
