package vn.unistock.unistockmanagementsystem.features.user.units;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.unistock.unistockmanagementsystem.entities.Unit;

import java.util.Optional;

public interface UnitRepository extends JpaRepository<Unit, Long> {
    boolean existsByUnitNameIgnoreCase(String unitName);
    Optional<Unit> findByUnitName(String unitName);
    Optional<Unit> findByUnitNameIgnoreCase(String unitName);
    boolean existsByUnitNameIgnoreCaseAndUnitIdNot(String unitName, Long unitId);
}
