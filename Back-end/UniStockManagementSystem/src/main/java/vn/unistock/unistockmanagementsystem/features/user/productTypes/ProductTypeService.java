package vn.unistock.unistockmanagementsystem.features.user.productTypes;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import vn.unistock.unistockmanagementsystem.entities.ProductType;
import vn.unistock.unistockmanagementsystem.features.user.productTypes.ProductTypeRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductTypeService {
    private final ProductTypeRepository productTypeRepository;
    private final ProductTypeMapper productTypeMapper = ProductTypeMapper.INSTANCE;

    public Page<ProductTypeDTO> getAllProductTypes(Pageable pageable) {
        Page<ProductType> productTypes = productTypeRepository.findAll(pageable);
        Page<ProductTypeDTO> productTypeDTOs = productTypes.map(productTypeMapper::toDTO);
        return productTypeDTOs;
    }

    public ProductTypeDTO toggleStatus(Long typeId, Boolean newStatus) {
        ProductType productType = productTypeRepository.findById(typeId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dòng sản phẩm với ID: " + typeId));
        productType.setStatus(newStatus);
        productTypeRepository.save(productType);
        return productTypeMapper.toDTO(productType);
    }

    public ProductTypeDTO createProductType(ProductTypeDTO productTypeDTO) {
        // Chuẩn hóa typeName
        String normalizedTypeName = productTypeDTO.getTypeName().trim();

        // Kiểm tra trùng tên dòng sản phẩm (case-insensitive)
        productTypeRepository.findByTypeNameIgnoreCase(normalizedTypeName)
                .ifPresent(existingType -> {
                    throw new RuntimeException("Tên dòng sản phẩm '" + normalizedTypeName + "' đã tồn tại!");
                });

        // Cập nhật typeName đã chuẩn hóa vào DTO
        productTypeDTO.setTypeName(normalizedTypeName);
        ProductType productType = productTypeMapper.toEntity(productTypeDTO);
        productType.setStatus(true);
        ProductType savedProductType = productTypeRepository.save(productType);
        return productTypeMapper.toDTO(savedProductType);
    }

    public ProductTypeDTO updateProductType(Long typeId, ProductTypeDTO productTypeDTO) {
        ProductType productType = productTypeRepository.findById(typeId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dòng sản phẩm với ID: " + typeId));

        // Chuẩn hóa typeName
        String normalizedTypeName = productTypeDTO.getTypeName().trim();

        // Kiểm tra trùng tên dòng sản phẩm (case-insensitive), bỏ qua bản ghi hiện tại
        if (!productType.getTypeName().equalsIgnoreCase(normalizedTypeName)) {
            productTypeRepository.findByTypeNameIgnoreCase(normalizedTypeName)
                    .ifPresent(existingType -> {
                        throw new RuntimeException("Tên dòng sản phẩm '" + normalizedTypeName + "' đã tồn tại!");
                    });
        }

        productType.setTypeName(normalizedTypeName);
        productType.setDescription(productTypeDTO.getDescription());

        ProductType updatedProductType = productTypeRepository.save(productType);
        return productTypeMapper.toDTO(updatedProductType);
    }

    public List<ProductTypeDTO> getActiveProductTypes() {
        return productTypeRepository.findAllByStatusTrue()
                .stream()
                .map(productTypeMapper::toDTO)
                .collect(Collectors.toList());
    }

    public boolean isTypeNameExists(String typeName, Long excludeId) {
        // Chuẩn hóa typeName
        String normalizedTypeName = typeName.trim();

        if (excludeId != null) {
            return productTypeRepository.existsByTypeNameIgnoreCaseAndTypeIdNot(normalizedTypeName, excludeId);
        }
        return productTypeRepository.existsByTypeNameIgnoreCase(normalizedTypeName);
    }
}