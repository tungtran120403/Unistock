package vn.unistock.unistockmanagementsystem.features.user.inventory;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/unistock/user/stockmovement")
@RequiredArgsConstructor
public class InventoryReportController {
    private final InventoryTransactionService inventoryTransactionService;

    @GetMapping("/report")
    public ResponseEntity<Page<StockMovementReportDTO>> getStockMovementReport(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String itemType,
            @RequestParam(required = false) Boolean hasMovementOnly
    ) {
        if (startDate == null || endDate == null) {
            LocalDateTime now = LocalDateTime.now();
            startDate = now.withDayOfMonth(1).withHour(0).withMinute(0);
            endDate = now.withDayOfMonth(now.toLocalDate().lengthOfMonth()).withHour(23).withMinute(59);
        }
        return ResponseEntity.ok(
                inventoryTransactionService.getStockMovement(startDate, endDate, itemType, hasMovementOnly, page, size)
        );
    }
}
