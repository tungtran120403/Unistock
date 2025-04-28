package vn.unistock.unistockmanagementsystem.features.user.inventory;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import vn.unistock.unistockmanagementsystem.entities.InventoryTransaction;
import vn.unistock.unistockmanagementsystem.entities.Material;
import vn.unistock.unistockmanagementsystem.entities.Product;
import vn.unistock.unistockmanagementsystem.features.user.materials.MaterialsRepository;
import vn.unistock.unistockmanagementsystem.features.user.products.ProductsRepository;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class InventoryTransactionService {
    private final InventoryTransactionRepository transactionRepo;
    private final ProductsRepository productRepo;
    private final MaterialsRepository materialRepo;
    private final StockMovementReportMapper stockMovementReportMapper;

    public Page<StockMovementReportDTO> getStockMovement(
            LocalDateTime startDate,
            LocalDateTime endDate,
            String itemType,
            Boolean hasMovementOnly,
            String search,
            Double minBegin,
            Double maxBegin,
            Double minIn,
            Double maxIn,
            Double minOut,
            Double maxOut,
            Double minEnd,
            Double maxEnd,
            int page,
            int size) {

        // 1. Calculate beginning quantities (before startDate)
        Map<Long, Double> productBegin = new HashMap<>();
        Map<Long, Double> materialBegin = new HashMap<>();
        calculateBeginningQuantities(startDate, productBegin, materialBegin);

        // 2. Calculate in-period quantities (between startDate and endDate)
        Map<Long, Double> productIn = new HashMap<>();
        Map<Long, Double> productOut = new HashMap<>();
        Map<Long, Double> materialIn = new HashMap<>();
        Map<Long, Double> materialOut = new HashMap<>();
        calculateInPeriodQuantities(startDate, endDate, productIn, productOut, materialIn, materialOut);

        // 3. Build result list with filters
        List<StockMovementReportDTO> result = new ArrayList<>();
        processItems(
                itemType, hasMovementOnly, search,
                minBegin, maxBegin, minIn, maxIn, minOut, maxOut, minEnd, maxEnd,
                productBegin, productIn, productOut, materialBegin, materialIn, materialOut,
                result
        );

        // 4. Apply pagination
        Pageable pageable = PageRequest.of(page, size);
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), result.size());
        return new PageImpl<>(result.subList(start, end), pageable, result.size());
    }

    private void calculateBeginningQuantities(LocalDateTime startDate, Map<Long, Double> productBegin, Map<Long, Double> materialBegin) {
        List<Map<String, Object>> beforeSummary = transactionRepo.summarizeBefore(startDate);
        for (Map<String, Object> row : beforeSummary) {
            Long pid = (Long) row.get("productId");
            Long mid = (Long) row.get("materialId");
            InventoryTransaction.TransactionType type = InventoryTransaction.TransactionType.valueOf(row.get("type").toString());
            Double total = ((Number) row.get("total")).doubleValue();

            if (pid != null) {
                productBegin.put(pid, productBegin.getOrDefault(pid, 0.0) + (type == InventoryTransaction.TransactionType.IMPORT ? total : -total));
            }

            if (mid != null) {
                materialBegin.put(mid, materialBegin.getOrDefault(mid, 0.0) + (type == InventoryTransaction.TransactionType.IMPORT ? total : -total));
            }
        }
    }

    private void calculateInPeriodQuantities(LocalDateTime startDate, LocalDateTime endDate,
                                             Map<Long, Double> productIn, Map<Long, Double> productOut,
                                             Map<Long, Double> materialIn, Map<Long, Double> materialOut) {
        List<Map<String, Object>> inPeriod = transactionRepo.summarizeTransactions(startDate, endDate);
        for (Map<String, Object> row : inPeriod) {
            Long pid = (Long) row.get("productId");
            Long mid = (Long) row.get("materialId");
            InventoryTransaction.TransactionType type = InventoryTransaction.TransactionType.valueOf(row.get("type").toString());
            Double total = ((Number) row.get("total")).doubleValue();

            if (pid != null) {
                if (type == InventoryTransaction.TransactionType.IMPORT) {
                    productIn.put(pid, productIn.getOrDefault(pid, 0.0) + total);
                } else {
                    productOut.put(pid, productOut.getOrDefault(pid, 0.0) + total);
                }
            } else if (mid != null) {
                if (type == InventoryTransaction.TransactionType.IMPORT) {
                    materialIn.put(mid, materialIn.getOrDefault(mid, 0.0) + total);
                } else {
                    materialOut.put(mid, materialOut.getOrDefault(mid, 0.0) + total);
                }
            }
        }
    }
    private boolean matchesQuantityFilters(StockMovementReportDTO dto,
                                           Double minBegin, Double maxBegin,
                                           Double minIn, Double maxIn,
                                           Double minOut, Double maxOut,
                                           Double minEnd, Double maxEnd) {
        return (minBegin == null || dto.getBeginQuantity() >= minBegin) &&
                (maxBegin == null || dto.getBeginQuantity() <= maxBegin) &&
                (minIn == null || dto.getInQuantity() >= minIn) &&
                (maxIn == null || dto.getInQuantity() <= maxIn) &&
                (minOut == null || dto.getOutQuantity() >= minOut) &&
                (maxOut == null || dto.getOutQuantity() <= maxOut) &&
                (minEnd == null || dto.getEndQuantity() >= minEnd) &&
                (maxEnd == null || dto.getEndQuantity() <= maxEnd);
    }

    private void processItems(String itemType, Boolean hasMovementOnly, String search,
                              Double minBegin, Double maxBegin, Double minIn, Double maxIn,
                              Double minOut, Double maxOut, Double minEnd, Double maxEnd,
                              Map<Long, Double> productBegin, Map<Long, Double> productIn, Map<Long, Double> productOut,
                              Map<Long, Double> materialBegin, Map<Long, Double> materialIn, Map<Long, Double> materialOut,
                              List<StockMovementReportDTO> result) {
        // Process Products
        if (!"MATERIAL".equalsIgnoreCase(itemType)) {
            Iterable<Product> products = search == null || search.isEmpty()
                    ? productRepo.findAll()
                    : productRepo.findByCodeOrName(search);
            for (Product p : products) {
                Long id = p.getProductId();
                double begin = productBegin.getOrDefault(id, 0.0);
                double in = productIn.getOrDefault(id, 0.0);
                double out = productOut.getOrDefault(id, 0.0);
                double end = begin + in - out;

                if (!Boolean.TRUE.equals(hasMovementOnly) || in > 0 || out > 0) {
                    StockMovementReportDTO dto = stockMovementReportMapper.fromProduct(p, begin, in, out, end);
                    if (matchesQuantityFilters(dto, minBegin, maxBegin, minIn, maxIn, minOut, maxOut, minEnd, maxEnd)) {
                        result.add(dto);
                    }
                }
            }
        }

        // Process Materials
        if (!"PRODUCT".equalsIgnoreCase(itemType)) {
            Iterable<Material> materials = search == null || search.isEmpty()
                    ? materialRepo.findAll()
                    : materialRepo.findByCodeOrName(search);
            for (Material m : materials) {
                Long id = m.getMaterialId();
                double begin = materialBegin.getOrDefault(id, 0.0);
                double in = materialIn.getOrDefault(id, 0.0);
                double out = materialOut.getOrDefault(id, 0.0);
                double end = begin + in - out;

                if (!Boolean.TRUE.equals(hasMovementOnly) || in > 0 || out > 0) {
                    StockMovementReportDTO dto = stockMovementReportMapper.fromMaterial(m, begin, in, out, end);
                    if (matchesQuantityFilters(dto, minBegin, maxBegin, minIn, maxIn, minOut, maxOut, minEnd, maxEnd)) {
                        result.add(dto);
                    }
                }
            }
        }
    }
}