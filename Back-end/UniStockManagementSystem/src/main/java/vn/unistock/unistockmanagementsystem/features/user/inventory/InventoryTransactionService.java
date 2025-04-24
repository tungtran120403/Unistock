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
            int page,
            int size) {

        // 1. Tổng hợp giao dịch trước startDate để tính tồn đầu kỳ
        List<Map<String, Object>> beforeSummary = transactionRepo.summarizeBefore(startDate);
        Map<Long, Double> productBegin = new HashMap<>();
        Map<Long, Double> materialBegin = new HashMap<>();

        for (Map<String, Object> row : beforeSummary) {
            Long pid = (Long) row.get("productId");
            Long mid = (Long) row.get("materialId");
            InventoryTransaction.TransactionType type = InventoryTransaction.TransactionType.valueOf(row.get("type").toString());
            Double total = ((Number) row.get("total")).doubleValue();

            if (pid != null) {
                productBegin.put(pid, productBegin.getOrDefault(pid, 0.0) + (type == InventoryTransaction.TransactionType.IMPORT ? total : -total));
            } else if (mid != null) {
                materialBegin.put(mid, materialBegin.getOrDefault(mid, 0.0) + (type == InventoryTransaction.TransactionType.IMPORT ? total : -total));
            }
        }

        // 2. Tổng hợp giao dịch trong kỳ
        List<Map<String, Object>> inPeriod = transactionRepo.summarizeTransactions(startDate, endDate);
        Map<Long, Double> productIn = new HashMap<>();
        Map<Long, Double> productOut = new HashMap<>();
        Map<Long, Double> materialIn = new HashMap<>();
        Map<Long, Double> materialOut = new HashMap<>();

        for (Map<String, Object> row : inPeriod) {
            Long pid = (Long) row.get("productId");
            Long mid = (Long) row.get("materialId");
            InventoryTransaction.TransactionType type = InventoryTransaction.TransactionType.valueOf(row.get("type").toString());
            Double total = ((Number) row.get("total")).doubleValue();

            if (pid != null) {
                if (type == InventoryTransaction.TransactionType.IMPORT) productIn.put(pid, total);
                else productOut.put(pid, total);
            } else if (mid != null) {
                if (type == InventoryTransaction.TransactionType.IMPORT) materialIn.put(mid, total);
                else materialOut.put(mid, total);
            }
        }

        List<StockMovementReportDTO> result = new ArrayList<>();

        if (!"MATERIAL".equalsIgnoreCase(itemType)) {
            for (Product p : productRepo.findAll()) {
                Long id = p.getProductId();
                double begin = productBegin.getOrDefault(id, 0.0);
                double in = productIn.getOrDefault(id, 0.0);
                double out = productOut.getOrDefault(id, 0.0);
                double end = begin + in - out;

                if (!Boolean.TRUE.equals(hasMovementOnly) || in > 0 || out > 0) {
                    result.add(stockMovementReportMapper.fromProduct(p, begin, in, out, end));
                }
            }
        }

        if (!"PRODUCT".equalsIgnoreCase(itemType)) {
            for (Material m : materialRepo.findAll()) {
                Long id = m.getMaterialId();
                double begin = materialBegin.getOrDefault(id, 0.0);
                double in = materialIn.getOrDefault(id, 0.0);
                double out = materialOut.getOrDefault(id, 0.0);
                double end = begin + in - out;

                if (!Boolean.TRUE.equals(hasMovementOnly) || in > 0 || out > 0) {
                    result.add(stockMovementReportMapper.fromMaterial(m, begin, in, out, end));
                }
            }
        }

        Pageable pageable = PageRequest.of(page, size);
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), result.size());
        return new PageImpl<>(result.subList(start, end), pageable, result.size());
    }

}
