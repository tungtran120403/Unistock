package vn.unistock.unistockmanagementsystem.features.user.warehouse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import vn.unistock.unistockmanagementsystem.entities.Warehouse;
import vn.unistock.unistockmanagementsystem.features.user.inventory.InventoryRepository;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UnitWarehouseTest {
    @Mock WarehouseRepository warehouseRepository;
    @Mock WarehouseMapper warehouseMapper;
    @Mock InventoryRepository inventoryRepository;
    @InjectMocks WarehouseService warehouseService;

    Warehouse warehouse;
    WarehouseDTO warehouseDTO;

    @BeforeEach
    void setup() {
        warehouse = new Warehouse();
        warehouse.setWarehouseId(1L);
        warehouse.setWarehouseCode("WH001");
        warehouse.setWarehouseName("Kho A");
        warehouse.setIsActive(true);
        warehouse.setGoodCategory("Điện tử");

        warehouseDTO = new WarehouseDTO();
        warehouseDTO.setWarehouseCode("WH001");
        warehouseDTO.setWarehouseName("Kho A");
        warehouseDTO.setGoodCategory("Điện tử");
    }

    // --- ADD ---
    @Test
    void addWarehouse_Normal() {
        when(warehouseRepository.existsByWarehouseName(anyString())).thenReturn(false);
        when(warehouseRepository.existsByWarehouseCode(anyString())).thenReturn(false);
        when(warehouseMapper.toEntity(any())).thenReturn(warehouse);
        when(warehouseRepository.save(any())).thenReturn(warehouse);

        Warehouse result = warehouseService.addWarehouse(warehouseDTO);
        assertEquals("Kho A", result.getWarehouseName());
    }

    @Test
    void addWarehouse_Abnormal_NameExists() {
        when(warehouseRepository.existsByWarehouseName(anyString())).thenReturn(true);
        assertThrows(RuntimeException.class, () -> warehouseService.addWarehouse(warehouseDTO));
    }

    @Test
    void addWarehouse_Abnormal_CodeExists() {
        when(warehouseRepository.existsByWarehouseName(anyString())).thenReturn(false);
        when(warehouseRepository.existsByWarehouseCode(anyString())).thenReturn(true);
        assertThrows(RuntimeException.class, () -> warehouseService.addWarehouse(warehouseDTO));
    }

    // --- GET ---
    @Test
    void getWarehouseById_Normal() {
        when(warehouseRepository.findById(1L)).thenReturn(Optional.of(warehouse));
        Warehouse result = warehouseService.getWarehouseById(1L);
        assertNotNull(result);
    }

    @Test
    void getWarehouseById_Abnormal_NotFound() {
        when(warehouseRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> warehouseService.getWarehouseById(1L));
    }

    @Test
    void getAllWarehouses_Boundary_EmptyPage() {
        when(warehouseRepository.findAll(any(PageRequest.class))).thenReturn(Page.empty());
        Page<Warehouse> result = warehouseService.getAllWarehouses(0, 10);
        assertTrue(result.isEmpty());
    }

    // --- UPDATE ---
    @Test
    void updateWarehouse_Normal() {
        when(warehouseRepository.findById(1L)).thenReturn(Optional.of(warehouse));
        when(warehouseRepository.existsByWarehouseName(anyString())).thenReturn(false);
        when(warehouseRepository.findAllByWarehouseIdNot(1L)).thenReturn(Collections.emptyList());
        when(warehouseRepository.save(any())).thenReturn(warehouse);

        Warehouse result = warehouseService.updateWarehouse(1L, warehouseDTO);
        assertNotNull(result);
    }

    @Test
    void updateWarehouse_Abnormal_NameExists() {
        when(warehouseRepository.findById(1L)).thenReturn(Optional.of(warehouse));
        when(warehouseRepository.existsByWarehouseName(anyString())).thenReturn(true);
        warehouseDTO.setWarehouseName("Kho B");
        assertThrows(RuntimeException.class, () -> warehouseService.updateWarehouse(1L, warehouseDTO));
    }

    @Test
    void updateWarehouse_Abnormal_CategoryConflict() {
        Warehouse other = new Warehouse();
        other.setGoodCategory("Điện tử");

        when(warehouseRepository.findById(1L)).thenReturn(Optional.of(warehouse));
        when(warehouseRepository.existsByWarehouseName(anyString())).thenReturn(false);
        when(warehouseRepository.findAllByWarehouseIdNot(1L)).thenReturn(List.of(other));

        warehouseDTO.setGoodCategory("Điện tử, Đồ gia dụng");
        assertThrows(RuntimeException.class, () -> warehouseService.updateWarehouse(1L, warehouseDTO));
    }

    // --- DELETE/STATUS ---
    @Test
    void updateWarehouseStatus_Normal_Deactivate() {
        when(warehouseRepository.findById(1L)).thenReturn(Optional.of(warehouse));
        when(inventoryRepository.existsStockInWarehouse(1L)).thenReturn(false);
        when(warehouseRepository.save(any())).thenReturn(warehouse);

        Warehouse result = warehouseService.updateWarehouseStatus(1L, false);
        assertFalse(result.getIsActive());
    }

    @Test
    void updateWarehouseStatus_Abnormal_HasStock() {
        when(warehouseRepository.findById(1L)).thenReturn(Optional.of(warehouse));
        when(inventoryRepository.existsStockInWarehouse(1L)).thenReturn(true);

        assertThrows(RuntimeException.class, () -> warehouseService.updateWarehouseStatus(1L, false));
    }

    @Test
    void updateWarehouseStatus_Boundary_ReActivate() {
        warehouse.setIsActive(false);
        when(warehouseRepository.findById(1L)).thenReturn(Optional.of(warehouse));
        when(warehouseRepository.save(any())).thenReturn(warehouse);

        Warehouse result = warehouseService.updateWarehouseStatus(1L, true);
        assertTrue(result.getIsActive());
    }
}
