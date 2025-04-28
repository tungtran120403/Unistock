package vn.unistock.unistockmanagementsystem.features.user.units;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.unistock.unistockmanagementsystem.entities.Unit;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UnitServiceTest {

    @Mock
    private UnitRepository unitRepository;

    @InjectMocks
    private UnitService unitService;

    @Test
    void getAllUnits_shouldReturnAllUnitsAsDTOs() {
        // Given
        Unit unit1 = new Unit();
        unit1.setUnitId(1L);
        unit1.setUnitName("Kilogram");

        Unit unit2 = new Unit();
        unit2.setUnitId(2L);
        unit2.setUnitName("Liter");

        List<Unit> units = List.of(unit1, unit2);

        when(unitRepository.findAll()).thenReturn(units);

        // When
        List<UnitDTO> result = unitService.getAllUnits();

        // Then
        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getUnitId());
        assertEquals("Kilogram", result.get(0).getUnitName());
        assertEquals(2L, result.get(1).getUnitId());
        assertEquals("Liter", result.get(1).getUnitName());

        verify(unitRepository, times(1)).findAll();
    }

    @Test
    void getAllUnits_whenNoUnits_shouldReturnEmptyList() {
        // Given
        when(unitRepository.findAll()).thenReturn(Collections.emptyList());

        // When
        List<UnitDTO> result = unitService.getAllUnits();

        // Then
        assertTrue(result.isEmpty());
        verify(unitRepository, times(1)).findAll();
    }
}