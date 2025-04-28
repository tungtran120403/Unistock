package vn.unistock.unistockmanagementsystem.features.user.inventory;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

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
            @RequestParam(required = false) Boolean hasMovementOnly,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Double minBegin,
            @RequestParam(required = false) Double maxBegin,
            @RequestParam(required = false) Double minIn,
            @RequestParam(required = false) Double maxIn,
            @RequestParam(required = false) Double minOut,
            @RequestParam(required = false) Double maxOut,
            @RequestParam(required = false) Double minEnd,
            @RequestParam(required = false) Double maxEnd
    ) {
        // Validate quantity filter ranges
        validateQuantityFilters(minBegin, maxBegin, "beginQuantity");
        validateQuantityFilters(minIn, maxIn, "inQuantity");
        validateQuantityFilters(minOut, maxOut, "outQuantity");
        validateQuantityFilters(minEnd, maxEnd, "endQuantity");

        // Set default date range if not provided
        if (startDate == null || endDate == null) {
            LocalDateTime now = LocalDateTime.now();
            startDate = now.withDayOfMonth(1).withHour(0).withMinute(0);
            endDate = now.withDayOfMonth(now.toLocalDate().lengthOfMonth()).withHour(23).withMinute(59);
        }

        return ResponseEntity.ok(
                inventoryTransactionService.getStockMovement(
                        startDate, endDate, itemType, hasMovementOnly, search,
                        minBegin, maxBegin, minIn, maxIn, minOut, maxOut, minEnd, maxEnd,
                        page, size
                )
        );
    }

    private void validateQuantityFilters(Double min, Double max, String fieldName) {
        if (min != null && max != null && min > max) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    String.format("Invalid range for %s: min (%s) cannot be greater than max (%s)", fieldName, min, max)
            );
        }
    }
}