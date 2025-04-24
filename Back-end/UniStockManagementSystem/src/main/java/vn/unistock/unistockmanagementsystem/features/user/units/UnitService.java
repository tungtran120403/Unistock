package vn.unistock.unistockmanagementsystem.features.user.units;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.unistock.unistockmanagementsystem.entities.Unit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UnitService {
    private final UnitRepository unitRepository;
    private final UnitMapper unitMapper = UnitMapper.INSTANCE;

    public Page<UnitDTO> getAllUnits(Pageable pageable) {
        Page<Unit> units = unitRepository.findAll(pageable);
        return units.map(unitMapper::toDTO);
    }

    public UnitDTO toggleStatus(Long unitId, Boolean newStatus) {
        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn vị tính với ID: " + unitId));
        unit.setStatus(newStatus);
        unitRepository.save(unit);
        return unitMapper.toDTO(unit);
    }

    public UnitDTO createUnit(UnitDTO unitDTO) {
        unitRepository.findByUnitNameIgnoreCase(unitDTO.getUnitName())
                .ifPresent(existingUnit -> {
                    throw new RuntimeException("Tên đơn vị tính '" + unitDTO.getUnitName() + "' đã tồn tại!");
                });

        Unit unit = unitMapper.toEntity(unitDTO);
        unit.setStatus(true);
        Unit savedUnit = unitRepository.save(unit);
        return unitMapper.toDTO(savedUnit);
    }

    public List<UnitDTO> getActiveUnits() {
        return unitRepository.findAll().stream()
                .filter(Unit::getStatus)
                .map(unitMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public UnitDTO updateUnit(Long unitId, UnitDTO unitDTO) {
        System.out.println("Received unitDTO: unitId=" + unitDTO.getUnitId() + ", unitName=" + unitDTO.getUnitName() + ", status=" + unitDTO.getStatus());

        Unit existingUnit = unitRepository.findById(unitId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn vị tính với ID: " + unitId));

        if (!existingUnit.getUnitName().equalsIgnoreCase(unitDTO.getUnitName())) {
            unitRepository.findByUnitNameIgnoreCase(unitDTO.getUnitName())
                    .ifPresent(unit -> {
                        throw new RuntimeException("Đơn vị tính '" + unitDTO.getUnitName() + "' đã tồn tại!");
                    });
        }

        System.out.println("Before update: unitName=" + existingUnit.getUnitName() + ", status=" + existingUnit.getStatus());
        existingUnit.setUnitName(unitDTO.getUnitName());
        existingUnit.setStatus(unitDTO.getStatus());
        System.out.println("After set: unitName=" + existingUnit.getUnitName() + ", status=" + existingUnit.getStatus());

        Unit updatedUnit = unitRepository.save(existingUnit);
        System.out.println("After save: unitName=" + updatedUnit.getUnitName() + ", status=" + updatedUnit.getStatus());

        return unitMapper.toDTO(updatedUnit);
    }

    public boolean isUnitNameExists(String unitName, Long excludeId) {
        if (excludeId != null) {
            return unitRepository.existsByUnitNameIgnoreCaseAndUnitIdNot(unitName, excludeId);
        }
        return unitRepository.existsByUnitNameIgnoreCase(unitName);
    }
}