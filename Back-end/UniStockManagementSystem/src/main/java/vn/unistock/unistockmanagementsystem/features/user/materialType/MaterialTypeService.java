package vn.unistock.unistockmanagementsystem.features.user.materialType;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import vn.unistock.unistockmanagementsystem.entities.MaterialType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class MaterialTypeService {
    private final MaterialTypeRepository materialTypeRepository;
    private final MaterialTypeMapper materialTypeMapper;

    public Page<MaterialTypeDTO> getAllMaterialTypes(Pageable pageable) {
        return materialTypeRepository.findAll(pageable).map(materialTypeMapper::toDTO);
    }

    public List<MaterialTypeDTO> getActiveMaterialTypes() {
        return materialTypeRepository.findAllByStatusTrue().stream()
                .map(materialTypeMapper::toDTO)
                .collect(Collectors.toList());
    }

    public MaterialTypeDTO getMaterialTypeById(Long id) {
        MaterialType materialType = materialTypeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Không tìm thấy danh mục vật tư"));
        return materialTypeMapper.toDTO(materialType);
    }

    @Transactional
    public MaterialTypeDTO createMaterialType(MaterialTypeDTO dto) {
        // Chuẩn hóa name
        String normalizedName = dto.getName().trim();

        // Kiểm tra trùng tên danh mục vật tư (case-insensitive)
        materialTypeRepository.findByNameIgnoreCase(normalizedName)
                .ifPresent(existingType -> {
                    throw new ResponseStatusException(BAD_REQUEST, "Tên danh mục vật tư '" + normalizedName + "' đã tồn tại!");
                });

        // Cập nhật name đã chuẩn hóa
        dto.setName(normalizedName);
        MaterialType materialType = materialTypeMapper.toEntity(dto);
        materialType.setStatus(true);

        MaterialType saved = materialTypeRepository.save(materialType);
        return materialTypeMapper.toDTO(saved);
    }

    @Transactional
    public MaterialTypeDTO updateMaterialType(Long id, MaterialTypeDTO dto) {
        MaterialType materialType = materialTypeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Không tìm thấy danh mục vật tư"));

        // Chuẩn hóa name
        String normalizedName = dto.getName().trim();

        // Kiểm tra trùng tên danh mục vật tư (case-insensitive), bỏ qua bản ghi hiện tại
        if (!materialType.getName().equalsIgnoreCase(normalizedName)) {
            materialTypeRepository.findByNameIgnoreCase(normalizedName)
                    .ifPresent(existingType -> {
                        throw new ResponseStatusException(BAD_REQUEST, "Tên danh mục vật tư '" + normalizedName + "' đã tồn tại!");
                    });
        }

        materialType.setName(normalizedName);
        materialType.setDescription(dto.getDescription());

        MaterialType saved = materialTypeRepository.save(materialType);
        return materialTypeMapper.toDTO(saved);
    }

    @Transactional
    public MaterialTypeDTO toggleStatus(Long id, boolean status) {
        MaterialType materialType = materialTypeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Không tìm thấy danh mục vật tư"));

        materialType.setStatus(status);
        MaterialType saved = materialTypeRepository.save(materialType);
        return materialTypeMapper.toDTO(saved);
    }

    public boolean isNameExists(String name, Long excludeId) {
        // Chuẩn hóa name
        String normalizedName = name.trim();

        if (excludeId != null) {
            return materialTypeRepository.existsByNameAndMaterialTypeIdNot(normalizedName, excludeId);
        }
        return materialTypeRepository.existsByNameIgnoreCase(normalizedName);
    }
}