package vn.unistock.unistockmanagementsystem.features.user.materials;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.unistock.unistockmanagementsystem.entities.Material;
import vn.unistock.unistockmanagementsystem.entities.MaterialPartner;
import vn.unistock.unistockmanagementsystem.entities.Partner;
import vn.unistock.unistockmanagementsystem.features.user.materialType.MaterialTypeRepository;
import vn.unistock.unistockmanagementsystem.features.user.notification.NotificationService;
import vn.unistock.unistockmanagementsystem.features.user.partner.PartnerRepository;
import vn.unistock.unistockmanagementsystem.features.user.units.UnitRepository;
import vn.unistock.unistockmanagementsystem.utils.storage.AzureBlobService;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaterialsService {
    private final MaterialsRepository materialsRepository;
    private final UnitRepository unitRepository;
    private final MaterialTypeRepository materialTypeRepository;
    private final MaterialsMapper materialsMapper;
    private final AzureBlobService azureBlobService;
    private final MaterialPartnerRepository materialPartnerRepository;
    private final PartnerRepository partnerRepository;
    private final NotificationService notificationService;

    // 🟢 Lấy tất cả nguyên liệu có phân trang
    public Page<MaterialsDTO> getAllMaterials(int page, int size, String search, List<Boolean> statuses, List<Long> typeIds) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Material> pageEntity = materialsRepository.searchMaterials(search, statuses, typeIds, pageable);
        return pageEntity.map(materialsMapper::toDTO);
    }

    // 🟢 Tạo nguyên vật liệu mới
    @Transactional
    public MaterialsDTO createMaterial(MaterialsDTO materialDTO, MultipartFile image) throws IOException {
        if (materialsRepository.existsByMaterialCode(materialDTO.getMaterialCode())) {
            throw new IllegalArgumentException("Mã nguyên vật liệu đã tồn tại!");
        }

        Material material = new Material();
        material.setMaterialCode(materialDTO.getMaterialCode());
        material.setMaterialName(materialDTO.getMaterialName());
        material.setDescription(materialDTO.getDescription());
        material.setLowStockThreshold(materialDTO.getLowStockThreshold()); // Thêm ngưỡng tồn kho thấp
        if (materialDTO.getMaterialCode() == null || materialDTO.getMaterialCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Mã nguyên vật liệu không được rỗng!");
        }
        materialDTO.setMaterialCode(materialDTO.getMaterialCode().trim());

        if (materialDTO.getUnitId() != null) {
            material.setUnit(unitRepository.findById(materialDTO.getUnitId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn vị với ID: " + materialDTO.getUnitId())));
        }
        if (materialDTO.getTypeId() != null) {
            material.setMaterialType(materialTypeRepository.findById(materialDTO.getTypeId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục với ID: " + materialDTO.getTypeId())));
        }

        material.setIsUsing(materialDTO.getIsUsing() != null ? materialDTO.getIsUsing() : true);

        // Xử lý upload ảnh
        if (image != null && !image.isEmpty()) {
            String contentType = image.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new IllegalArgumentException("File phải là ảnh (JPG, PNG, v.v.)");
            }
            if (image.getSize() == 0) {
                throw new IllegalArgumentException("File ảnh không được rỗng!");
            }
            try {
                String imageUrl = azureBlobService.uploadFile(image);
                material.setImageUrl(imageUrl);
            } catch (Exception e) {
                throw new IOException("Không thể upload ảnh: " + e.getMessage(), e);
            }
        }

        Material savedMaterial = materialsRepository.save(material);

        // Xử lý nhà cung cấp
        if (materialDTO.getSupplierIds() != null && !materialDTO.getSupplierIds().isEmpty()) {
            List<MaterialPartner> materialPartners = materialDTO.getSupplierIds().stream()
                    .map(supplierId -> {
                        Partner partner = partnerRepository.findById(supplierId)
                                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhà cung cấp với ID: " + supplierId));
                        return new MaterialPartner(null, savedMaterial, partner);
                    })
                    .collect(Collectors.toList());

            materialPartnerRepository.saveAll(materialPartners);
            savedMaterial.getMaterialPartners().addAll(materialPartners);
        }

        MaterialsDTO result = materialsMapper.toDTO(savedMaterial);
        log.info("DTO trả về với imageUrl: {}", result.getImageUrl());
        return result;
    }

    // 🟢 Lấy nguyên vật liệu theo ID
    public MaterialsDTO getMaterialById(Long materialId) {
        Material material = materialsRepository.findByIdWithPartners(materialId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy vật tư với ID: " + materialId));

        return materialsMapper.toDTO(material);
    }

    // 🟢 Bật/tắt trạng thái sử dụng nguyên vật liệu
    @Transactional
    public MaterialsDTO toggleUsingStatus(Long id) {
        Material material = materialsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nguyên vật liệu"));

        material.setIsUsing(!Boolean.TRUE.equals(material.getIsUsing()));
        Material savedMaterial = materialsRepository.save(material);
        return materialsMapper.toDTO(savedMaterial);
    }

    // 🟢 Kiểm tra mã nguyên vật liệu đã tồn tại chưa
    public boolean isMaterialCodeExists(String materialCode, Long excludeId) {
        if (excludeId != null) {
            return materialsRepository.existsByMaterialCodeAndMaterialIdNot(materialCode, excludeId);
        }
        return materialsRepository.existsByMaterialCode(materialCode);
    }

    // 🟢 Cập nhật nguyên vật liệu
    @Transactional
    public MaterialsDTO updateMaterial(Long id, MaterialsDTO updatedMaterial, MultipartFile newImage) throws IOException {
        Material material = materialsRepository.findByIdWithPartners(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nguyên vật liệu"));

        if (!material.getMaterialCode().equals(updatedMaterial.getMaterialCode()) &&
                materialsRepository.existsByMaterialCodeAndMaterialIdNot(updatedMaterial.getMaterialCode(),id)) {
            throw new IllegalArgumentException("Mã nguyên vật liệu đã tồn tại!");
        }

        material.setMaterialCode(updatedMaterial.getMaterialCode());
        material.setMaterialName(updatedMaterial.getMaterialName());
        material.setDescription(updatedMaterial.getDescription());
        material.setLowStockThreshold(updatedMaterial.getLowStockThreshold()); // Thêm ngưỡng tồn kho thấp

        if (updatedMaterial.getUnitId() != null) {
            material.setUnit(unitRepository.findById(updatedMaterial.getUnitId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn vị với ID: " + updatedMaterial.getUnitId())));
        } else {
            material.setUnit(null);
        }

        if (updatedMaterial.getTypeId() != null) {
            material.setMaterialType(materialTypeRepository.findById(updatedMaterial.getTypeId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục với ID: " + updatedMaterial.getTypeId())));
        } else {
            material.setMaterialType(null);
        }

        if (updatedMaterial.getIsUsing() != null) {
            material.setIsUsing(updatedMaterial.getIsUsing());
        }

        if (newImage != null && !newImage.isEmpty()) {
            try {
                log.info("Uploading new image: {}", newImage.getOriginalFilename());
                if (material.getImageUrl() != null) {
                    log.info("Deleting old image: {}", material.getImageUrl());
                    azureBlobService.deleteFile(material.getImageUrl());
                }
                String newImageUrl = azureBlobService.uploadFile(newImage);
                log.info("Uploaded new image URL: {}", newImageUrl);
                material.setImageUrl(newImageUrl);
            } catch (Exception e) {
                log.error("Failed to upload new image: {}", e.getMessage(), e);
                throw new IOException("Không thể upload ảnh mới: " + e.getMessage(), e);
            }
        }

        material.getMaterialPartners().clear();
        if (updatedMaterial.getSupplierIds() != null && !updatedMaterial.getSupplierIds().isEmpty()) {
            List<MaterialPartner> materialPartners = updatedMaterial.getSupplierIds().stream()
                    .map(supplierId -> {
                        Partner partner = partnerRepository.findById(supplierId)
                                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhà cung cấp với ID: " + supplierId));
                        return new MaterialPartner(null, material, partner);
                    })
                    .collect(Collectors.toList());

            materialPartnerRepository.saveAll(materialPartners);
            material.getMaterialPartners().addAll(materialPartners);
        }

        Material savedMaterial = materialsRepository.save(material);
        log.info("Updated material with imageUrl: {}", savedMaterial.getImageUrl());
        notificationService.clearLowStockNotificationIfRecovered(savedMaterial.getMaterialId());
        notificationService.checkLowStock(savedMaterial.getMaterialId());
        return materialsMapper.toDTO(savedMaterial);
    }

    // 🟢 Lấy danh sách nguyên liệu đang hoạt động
    public List<MaterialsDTO> getAllActiveMaterials() {
        List<Material> activeMaterials = materialsRepository.findAllByIsUsingTrue();
        return activeMaterials.stream()
                .map(materialsMapper::toDTO)
                .collect(Collectors.toList());
    }
}