package vn.unistock.unistockmanagementsystem.features.user.partner.partnerByType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.unistock.unistockmanagementsystem.entities.PartnerByType;
import vn.unistock.unistockmanagementsystem.entities.PartnerByTypeKey;
import vn.unistock.unistockmanagementsystem.entities.PartnerType;

import java.util.List;

public interface PartnerByTypeRepository extends JpaRepository<PartnerByType, PartnerByTypeKey> {
    int countByPartnerType(PartnerType partnerType);

    @Query("SELECT p.partnerCode FROM PartnerByType p WHERE p.partnerCode LIKE CONCAT(:prefix, '%')")
    List<String> findAllCodesByPrefix(@Param("prefix") String prefix);
}
