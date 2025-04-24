package vn.unistock.unistockmanagementsystem.features.user.partnerType;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import vn.unistock.unistockmanagementsystem.entities.PartnerType;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PartnerTypeService {
    private final PartnerTypeRepository partnerTypeRepository;
    private final PartnerTypeMapper partnerTypeMapper;

    //Lấy danh sách loại đối tác
    public Page<PartnerTypeDTO> getAllPartnerTypes(Pageable pageable) {
        Page<PartnerType> partnerTypes = partnerTypeRepository.findAll(pageable);
        Page<PartnerTypeDTO> partnerTypeDTOS = partnerTypes.map(partnerTypeMapper::toDTO);
        return partnerTypeDTOS;
    }

    //Thêm mới loại đối tác
    public PartnerTypeDTO addPartnerType(PartnerTypeDTO partnerTypeDTO) {
        boolean codeExists = partnerTypeRepository.existsByTypeCode(partnerTypeDTO.getTypeCode());
        boolean nameExists = partnerTypeRepository.existsByTypeName(partnerTypeDTO.getTypeName());

        if (codeExists && nameExists) {
            throw new IllegalArgumentException("DUPLICATE_CODE_AND_NAME");
        } else if (codeExists) {
            throw new IllegalArgumentException("DUPLICATE_CODE");
        } else if (nameExists) {
            throw new IllegalArgumentException("DUPLICATE_NAME");
        }

        PartnerType partnerType = partnerTypeMapper.toEntity(partnerTypeDTO);
        partnerType = partnerTypeRepository.save(partnerType);
        return partnerTypeMapper.toDTO(partnerType);
    }

    //Cập nhật loại đối tác
    public PartnerTypeDTO updatePartnerType(Long id, PartnerTypeDTO partnerTypeDTO) {
        PartnerType partnerType = partnerTypeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Loại đối tác không tồn tại"));

        boolean isTypeCodeChanged = !partnerType.getTypeCode().equals(partnerTypeDTO.getTypeCode());
        boolean isTypeNameChanged = !partnerType.getTypeName().equals(partnerTypeDTO.getTypeName());

        boolean codeExists = isTypeCodeChanged && partnerTypeRepository.existsByTypeCode(partnerTypeDTO.getTypeCode());
        boolean nameExists = isTypeNameChanged && partnerTypeRepository.existsByTypeName(partnerTypeDTO.getTypeName());

        if (codeExists && nameExists) {
            throw new IllegalArgumentException("DUPLICATE_CODE_AND_NAME");
        } else if (codeExists) {
            throw new IllegalArgumentException("DUPLICATE_CODE");
        } else if (nameExists) {
            throw new IllegalArgumentException("DUPLICATE_NAME");
        }

        partnerType.setTypeCode(partnerTypeDTO.getTypeCode());
        partnerType.setTypeName(partnerTypeDTO.getTypeName());
        partnerType.setStatus(partnerTypeDTO.getStatus());
        partnerType.setDescription(partnerTypeDTO.getDescription());

        partnerType = partnerTypeRepository.save(partnerType);
        return partnerTypeMapper.toDTO(partnerType);
    }

    public PartnerTypeDTO updatePartnerTypeStatus(Long id, Boolean isActive) {
        PartnerType partnerType = partnerTypeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Loại đối tác không tồn tại"));

        partnerType.setStatus(isActive);
        partnerType = partnerTypeRepository.save(partnerType);
        return partnerTypeMapper.toDTO(partnerType);
    }

    public PartnerType getPartnerTypeByCode(String typeCode) {
        return partnerTypeRepository.findByTypeCode(typeCode)
               .orElseThrow(() -> new IllegalArgumentException("Loại đối tác không tồn tại"));
    }

    public PartnerType getPartnerTypeById(Long typeId) {
        return partnerTypeRepository.findById(typeId)
                .orElseThrow(() -> new IllegalArgumentException("Loại đối tác không tồn tại"));
    }
}