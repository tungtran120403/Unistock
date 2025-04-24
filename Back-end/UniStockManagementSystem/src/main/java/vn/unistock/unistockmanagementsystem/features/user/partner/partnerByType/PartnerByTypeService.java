package vn.unistock.unistockmanagementsystem.features.user.partner.partnerByType;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.unistock.unistockmanagementsystem.entities.Partner;
import vn.unistock.unistockmanagementsystem.entities.PartnerByType;
import vn.unistock.unistockmanagementsystem.entities.PartnerByTypeKey;
import vn.unistock.unistockmanagementsystem.entities.PartnerType;
import vn.unistock.unistockmanagementsystem.features.user.partnerType.PartnerTypeService;

import java.util.List;

@Service
public class PartnerByTypeService {
    @Autowired
    private PartnerByTypeRepository partnerByTypeRepository;

    @Autowired
    private PartnerTypeService partnerTypeService;

    public PartnerByType createPartnerByCode(Partner partner, String partnerCode) {
        // Tìm PartnerType dựa trên prefix của mã đối tác
        String typeCode = partnerCode.replaceAll("[0-9]", ""); // Lấy phần chữ cái
        PartnerType partnerType = partnerTypeService.getPartnerTypeByCode(typeCode);

        if (partnerType == null) {
            throw new IllegalArgumentException("Không tìm thấy nhóm đối tác với mã: " + typeCode);
        }

        PartnerByTypeKey key = new PartnerByTypeKey(partner.getPartnerId(), partnerType.getTypeId());
        PartnerByType partnerByType = new PartnerByType();
        partnerByType.setId(key);
        partnerByType.setPartner(partner);
        partnerByType.setPartnerType(partnerType);
        partnerByType.setPartnerCode(partnerCode);

        return partnerByTypeRepository.save(partnerByType);
    }

    public String generatePartnerCode(Long typeId) {
        PartnerType partnerType = partnerTypeService.getPartnerTypeById(typeId);
        if (partnerType == null) {
            throw new IllegalArgumentException("Nhóm đối tác không tồn tại!");
        }

        String prefix = partnerType.getTypeCode(); // ví dụ: "NCC"

        // Lấy tất cả mã có prefix này, ví dụ: ["NCC01", "NCC02", "NCC03"]
        List<String> existingCodes = partnerByTypeRepository.findAllCodesByPrefix(prefix);

        // Lấy số lớn nhất trong các mã
        int max = existingCodes.stream()
                .map(code -> code.replace(prefix, "")) // "NCC03" → "03"
                .filter(num -> num.matches("\\d+"))    // chỉ số hợp lệ
                .mapToInt(Integer::parseInt)
                .max()
                .orElse(0); // nếu không có mã nào, bắt đầu từ 1

        return prefix + String.format("%05d", max + 1); // ví dụ: NCC04
    }
}

