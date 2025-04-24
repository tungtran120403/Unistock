package vn.unistock.unistockmanagementsystem.features.user.partner;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import vn.unistock.unistockmanagementsystem.entities.Partner;
import vn.unistock.unistockmanagementsystem.entities.PartnerByType;
import vn.unistock.unistockmanagementsystem.entities.PartnerByTypeKey;
import vn.unistock.unistockmanagementsystem.entities.PartnerType;
import vn.unistock.unistockmanagementsystem.features.user.partner.partnerByType.PartnerByTypeRepository;
import vn.unistock.unistockmanagementsystem.features.user.partner.partnerByType.PartnerByTypeService;
import vn.unistock.unistockmanagementsystem.features.user.partnerType.PartnerTypeDTO;
import vn.unistock.unistockmanagementsystem.features.user.partnerType.PartnerTypeRepository;
import vn.unistock.unistockmanagementsystem.features.user.partnerType.PartnerTypeService;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PartnerService {
    private final PartnerRepository partnerRepository;
    private final PartnerMapper partnerMapper;
    private final PartnerTypeService partnerTypeService;
    private final PartnerByTypeService partnerByTypeService;

    // Lấy danh sách đối tác kèm danh sách loại đối tác
    public Page<PartnerDTO> getAllPartners(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Partner> partnerPage = partnerRepository.findAll(pageable);
        return partnerPage.map(partnerMapper::toDTO);
    }

    // Thêm mới đối tác
    public PartnerDTO createPartner(PartnerDTO partnerDTO) {
        if (partnerDTO.getPartnerCodes() == null || partnerDTO.getPartnerCodes().isEmpty()) {
            throw new IllegalArgumentException("NO_PARTNER_TYPE");
        }

        if (partnerRepository.existsByPartnerName(partnerDTO.getPartnerName())) {
            throw new IllegalArgumentException("DUPLICATE_NAME");
        }

        // Tạo mới Partner
        Partner partner = Partner.builder()
                .partnerName(partnerDTO.getPartnerName())
                .contactName(partnerDTO.getContactName())
                .address(partnerDTO.getAddress())
                .phone(partnerDTO.getPhone())
                .email(partnerDTO.getEmail())
                .partnerTypes(new HashSet<>())
                .build();

        partner = partnerRepository.save(partner);

        for (String partnerCode : partnerDTO.getPartnerCodes()) {
            PartnerByType partnerByType = partnerByTypeService.createPartnerByCode(partner, partnerCode);
            partner.getPartnerTypes().add(partnerByType); // Thêm thay vì set toàn bộ
        }
        partner = partnerRepository.save(partner);

        return partnerMapper.toDTO(partner);
    }

    public Page<PartnerDTO> getPartnersByType(Long typeId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        Page<Partner> partnerPage = partnerRepository.findByPartnerTypes_PartnerType_typeId(typeId, pageable);
        return partnerPage.map(partnerMapper::toDTO);
    }

    public List<PartnerDTO> getPartnersByMaterial(Long materialId) {
        List<Partner> partners = partnerRepository.findPartnersByMaterialId(materialId);
        return partners.stream()
                .map(partnerMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<PartnerDTO> getPartnersByCodePrefix(String prefix) {
        List<Partner> partners = partnerRepository.findByPartnerCodePrefix(prefix);
        return partners.stream()
                .map(partnerMapper::toDTO)
                .collect(Collectors.toList());
    }

    public Object updatePartner(PartnerDTO partnerDTO) {
        Partner existingPartner = partnerRepository.findById(partnerDTO.getPartnerId())
                .orElseThrow(() -> new IllegalArgumentException("PARTNER_NOT_FOUND"));

        // Kiểm tra tên trùng với đối tác khác
        if (partnerDTO.getPartnerCodes() == null || partnerDTO.getPartnerCodes().isEmpty()) {
            throw new IllegalArgumentException("NO_PARTNER_TYPE");
        }

        if (!partnerRepository.existsByPartnerNameAndPartnerId(
                partnerDTO.getPartnerName(), partnerDTO.getPartnerId())) {
            throw new IllegalArgumentException("DUPLICATE_NAME");
        }

        // Cập nhật thông tin cơ bản
        existingPartner.setPartnerName(partnerDTO.getPartnerName());
        existingPartner.setContactName(partnerDTO.getContactName());
        existingPartner.setPhone(partnerDTO.getPhone());
        existingPartner.setEmail(partnerDTO.getEmail());
        existingPartner.setAddress(partnerDTO.getAddress());

        // Cập nhật danh sách nhóm đối tác (xóa cũ → thêm mới)
        // 1. Xóa toàn bộ nhóm cũ
        existingPartner.getPartnerTypes().clear();

        // 2. Tạo lại từ danh sách partnerCodes mới
        Set<PartnerByType> newTypes = partnerDTO.getPartnerCodes().stream()
                .map(code -> partnerByTypeService.createPartnerByCode(existingPartner, code))
                .collect(Collectors.toSet());

        existingPartner.getPartnerTypes().addAll(newTypes);

        // Lưu lại
        Partner updated = partnerRepository.save(existingPartner);
        return partnerMapper.toDTO(updated);
    }
}
