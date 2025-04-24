package vn.unistock.unistockmanagementsystem.features.user.partner.partnerByType;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.unistock.unistockmanagementsystem.features.user.partner.PartnerDTO;

import java.util.List;

@RestController
@RequestMapping("/api/unistock/user/partner/code")
public class PartnerByTypeController {
    @Autowired
    private PartnerByTypeService partnerByTypeService;

    @GetMapping("{typeId}")
    public ResponseEntity<String> getPartnerCode(@PathVariable Long typeId) {
        String partnerCode = partnerByTypeService.generatePartnerCode(typeId);
        return ResponseEntity.ok(partnerCode);
    }
}
