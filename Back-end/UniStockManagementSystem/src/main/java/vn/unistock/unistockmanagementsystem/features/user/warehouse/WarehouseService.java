package vn.unistock.unistockmanagementsystem.features.user.warehouse;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import vn.unistock.unistockmanagementsystem.entities.Warehouse;
import vn.unistock.unistockmanagementsystem.features.user.inventory.InventoryRepository;

import java.util.*;

@Service
@RequiredArgsConstructor
public class WarehouseService {
    @Autowired
    private final WarehouseRepository warehouseRepository;
    @Autowired
    private final WarehouseMapper warehouseMapper;
    @Autowired
    private final InventoryRepository inventoryRepository;

    public Warehouse addWarehouse(WarehouseDTO warehouseDTO) {
        if (warehouseRepository.existsByWarehouseName(warehouseDTO.getWarehouseName()))
            throw new RuntimeException("Tên kho đã tồn tại");

        if (warehouseRepository.existsByWarehouseCode(warehouseDTO.getWarehouseCode()))
            throw new RuntimeException("Mã kho đã tồn tại");

        Warehouse warehouse = warehouseMapper.toEntity(warehouseDTO);
        System.out.println("DTO goodCategory: " + warehouseDTO.getGoodCategory());
        System.out.println("Mapped Entity goodCategory: " + warehouse.getGoodCategory());
        return warehouseRepository.save(warehouse);
    }

    public Page<Warehouse> getAllWarehouses(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Warehouse> warehousePage = warehouseRepository.findAll(pageable);
        return warehousePage;
    }

    public List<Warehouse> getAllActiveWarehouses() {
        return warehouseRepository.findAllByIsActive(true);
    }

    public Warehouse getWarehouseById(Long id) {
        return warehouseRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy kho với ID được cung cấp"));
    }

    public Warehouse updateWarehouse(Long id, WarehouseDTO warehouseDTO) {
        Warehouse warehouse = getWarehouseById(id);

        // ✅ Kiểm tra trùng tên
        if (warehouseRepository.existsByWarehouseName(warehouseDTO.getWarehouseName())
                && !warehouseDTO.getWarehouseName().equals(warehouse.getWarehouseName())) {
            throw new RuntimeException("Tên kho đã tồn tại");
        }

        // ✅ Kiểm tra trùng phân loại (ràng buộc nghiệp vụ)
        String goodCategory = warehouseDTO.getGoodCategory();
        List<String> newCategories = goodCategory != null
                ? Arrays.stream(goodCategory.split(",\\s*")).toList()
                : List.of();

        List<Warehouse> otherWarehouses = warehouseRepository.findAllByWarehouseIdNot(id);

        for (Warehouse other : otherWarehouses) {
            if (other.getGoodCategory() == null) continue;

            List<String> otherCategories = Arrays.stream(other.getGoodCategory().split(",\\s*")).toList();
            for (String cat : newCategories) {
                if (otherCategories.contains(cat)) {
                    throw new RuntimeException("Phân loại '" + cat + "' đã được gán cho kho khác.");
                }
            }
        }

        // ✅ Áp dụng cập nhật
        warehouseMapper.updateEntityFromDto(warehouseDTO, warehouse);
        return warehouseRepository.save(warehouse);
    }


    public Warehouse updateWarehouseStatus(Long id, Boolean isActive) {
        Warehouse warehouse = getWarehouseById(id);
        if (!isActive) {
            boolean hasStock = inventoryRepository.existsStockInWarehouse(id);
            if (hasStock) {
                throw new RuntimeException("Thay đổi trạng thái kho không thành công. Không thể dừng hoạt động kho này khi vẫn còn hàng hóa lưu kho.");
            }
        }
        warehouse.setIsActive(isActive);
        return warehouseRepository.save(warehouse);
    }

    public boolean isWarehouseCodeExists(String warehouseCode, Long excludeId) {
        if (excludeId != null) {
            return warehouseRepository.existsByWarehouseCodeAndWarehouseIdNot(warehouseCode, excludeId);
        }
        return warehouseRepository.existsByWarehouseCode(warehouseCode);
    }

    public Page<Warehouse> searchWarehouses(String search, Boolean isActive, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return warehouseRepository.searchWarehouses(search, isActive, pageable);
    }

    public List<String> getUsedWarehouseCategories(Long excludeWarehouseId) {
        List<Warehouse> warehouses = excludeWarehouseId != null
                ? warehouseRepository.findAllByWarehouseIdNot(excludeWarehouseId)
                : warehouseRepository.findAll();

        return warehouses.stream()
                .map(Warehouse::getGoodCategory)
                .filter(Objects::nonNull)
                .flatMap(cat -> Arrays.stream(cat.split(",\\s*")))
                .distinct()
                .toList();
    }

    public Map<String, Boolean> checkWarehouseNameAndCode(String warehouseName, String warehouseCode, Long excludeId) {
        boolean nameExists;
        boolean codeExists;

        if (excludeId != null) {
            Warehouse existing = warehouseRepository.findByWarehouseId(excludeId);
            nameExists = !existing.getWarehouseName().equals(warehouseName)
                    && warehouseRepository.existsByWarehouseName(warehouseName);

            codeExists = !existing.getWarehouseCode().equals(warehouseCode)
                    && warehouseRepository.existsByWarehouseCode(warehouseCode);
        } else {
            nameExists = warehouseRepository.existsByWarehouseName(warehouseName);
            codeExists = warehouseRepository.existsByWarehouseCode(warehouseCode);
        }

        Map<String, Boolean> result = new HashMap<>();
        result.put("nameExists", nameExists);
        result.put("codeExists", codeExists);
        return result;
    }

}
