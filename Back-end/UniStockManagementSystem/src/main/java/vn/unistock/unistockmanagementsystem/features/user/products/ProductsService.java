package vn.unistock.unistockmanagementsystem.features.user.products;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import vn.unistock.unistockmanagementsystem.entities.Product;
import vn.unistock.unistockmanagementsystem.entities.ProductMaterial;
import vn.unistock.unistockmanagementsystem.features.user.materials.MaterialsRepository;
import vn.unistock.unistockmanagementsystem.features.user.productTypes.ProductTypeRepository;
import vn.unistock.unistockmanagementsystem.utils.storage.AzureBlobService;
import vn.unistock.unistockmanagementsystem.features.user.units.UnitRepository;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductsService {
    private final ProductsRepository productsRepository;
    private final UnitRepository unitRepository;
    private final ProductTypeRepository productTypeRepository;
    private final MaterialsRepository materialRepository;
    private final ProductMaterialsRepository productMaterialsRepository;
    private final ProductsMapper productsMapper = ProductsMapper.INSTANCE;
    private final ProductMaterialsMapper productMaterialsMapper;
    private final AzureBlobService azureBlobService;

    public Page<ProductsDTO> getAllProducts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> productPage = productsRepository.findAll(pageable);
        return productPage.map(productsMapper::toDTO);
    }

    @Transactional
    public Product createProduct(ProductsDTO dto, String createdBy) throws IOException {
        if (productsRepository.existsByProductCode(dto.getProductCode())) {
            throw new IllegalArgumentException("Mã sản phẩm đã tồn tại!");
        }

        Product product = productsMapper.toEntity(dto);
        product.setIsProductionActive(dto.getIsProductionActive() != null ? dto.getIsProductionActive() : true);
        product.setCreatedBy(createdBy);
        product.setCreatedAt(LocalDateTime.now());

        if (dto.getImage() != null && !dto.getImage().isEmpty()) {
            String imageUrl = azureBlobService.uploadFile(dto.getImage());
            product.setImageUrl(imageUrl);
        }

        if (dto.getUnitId() != null) {
            product.setUnit(unitRepository.findById(dto.getUnitId())
                    .orElseThrow(() -> new IllegalArgumentException("Đơn vị không tồn tại!")));
        }
        if (dto.getTypeId() != null) {
            product.setProductType(productTypeRepository.findById(dto.getTypeId())
                    .orElseThrow(() -> new IllegalArgumentException("Loại sản phẩm không tồn tại!")));
        }

        Product savedProduct = productsRepository.save(product);

        if (dto.getMaterials() != null && !dto.getMaterials().isEmpty()) {
            Set<Long> addedMaterialIds = new HashSet<>();
            List<ProductMaterial> productMaterials = new ArrayList<>();
            for (ProductMaterialsDTO materialDTO : dto.getMaterials()) {
                if (!addedMaterialIds.contains(materialDTO.getMaterialId())) {
                    ProductMaterial productMaterial = new ProductMaterial();
                    productMaterial.setProduct(savedProduct);
                    productMaterial.setMaterial(materialRepository.findById(materialDTO.getMaterialId())
                            .orElseThrow(() -> new IllegalArgumentException("Nguyên vật liệu không tồn tại!")));
                    productMaterial.setQuantity(materialDTO.getQuantity());
                    productMaterials.add(productMaterial);
                    addedMaterialIds.add(materialDTO.getMaterialId());
                }
            }
            productMaterialsRepository.saveAll(productMaterials);
            savedProduct.setProductMaterials(productMaterials);
        }

        return savedProduct;
    }

    public ProductsDTO getProductById(Long productId) {
        Product product = productsRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm với ID: " + productId));
        return productsMapper.toDTO(product);
    }

    @Transactional
    public ProductsDTO updateProduct(Long id, ProductsDTO updatedProduct, MultipartFile newImage) throws IOException {
        Product product = productsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        if (!product.getProductCode().equals(updatedProduct.getProductCode()) &&
                productsRepository.existsByProductCode(updatedProduct.getProductCode())) {
            throw new IllegalArgumentException("Mã sản phẩm đã tồn tại!");
        }

        Product updatedEntity = productsMapper.toEntity(updatedProduct);
        product.setProductCode(updatedEntity.getProductCode());
        product.setProductName(updatedEntity.getProductName());
        product.setDescription(updatedEntity.getDescription());
        product.setIsProductionActive(updatedProduct.getIsProductionActive() != null ? updatedProduct.getIsProductionActive() : true);

        if (updatedProduct.getUnitId() != null) {
            product.setUnit(unitRepository.findById(updatedProduct.getUnitId())
                    .orElseThrow(() -> new IllegalArgumentException("Đơn vị không tồn tại!")));
        }
        if (updatedProduct.getTypeId() != null) {
            product.setProductType(productTypeRepository.findById(updatedProduct.getTypeId())
                    .orElseThrow(() -> new IllegalArgumentException("Loại sản phẩm không tồn tại!")));
        }

        if (newImage != null && !newImage.isEmpty()) {
            if (product.getImageUrl() != null) {
                azureBlobService.deleteFile(product.getImageUrl());
            }
            String newImageUrl = azureBlobService.uploadFile(newImage);
            product.setImageUrl(newImageUrl);
        }

        List<ProductMaterial> productMaterials = product.getProductMaterials();
        if (updatedProduct.getMaterials() != null && !updatedProduct.getMaterials().isEmpty()) {
            Map<Long, ProductMaterial> existingMaterialMap = productMaterials.stream()
                    .collect(Collectors.toMap(pm -> pm.getMaterial().getMaterialId(), pm -> pm));

            List<ProductMaterial> updatedMaterials = new ArrayList<>();
            Set<Long> handledMaterialIds = new HashSet<>();

            for (ProductMaterialsDTO materialDTO : updatedProduct.getMaterials()) {
                if (handledMaterialIds.contains(materialDTO.getMaterialId())) continue;
                handledMaterialIds.add(materialDTO.getMaterialId());

                ProductMaterial productMaterial = existingMaterialMap.get(materialDTO.getMaterialId());
                if (productMaterial != null) {
                    productMaterial.setQuantity(materialDTO.getQuantity());
                    updatedMaterials.add(productMaterial);
                    existingMaterialMap.remove(materialDTO.getMaterialId());
                } else {
                    productMaterial = new ProductMaterial();
                    productMaterial.setProduct(product);
                    productMaterial.setMaterial(materialRepository.findById(materialDTO.getMaterialId())
                            .orElseThrow(() -> new IllegalArgumentException("Nguyên vật liệu không tồn tại!")));
                    productMaterial.setQuantity(materialDTO.getQuantity());
                    updatedMaterials.add(productMaterial);
                }
            }

            if (!existingMaterialMap.isEmpty()) {
                productMaterials.removeAll(existingMaterialMap.values());
                productMaterialsRepository.deleteAll(existingMaterialMap.values());
            }

            productMaterials.clear();
            productMaterials.addAll(updatedMaterials);
        } else {
            if (!productMaterials.isEmpty()) {
                productMaterialsRepository.deleteAll(productMaterials);
                productMaterials.clear();
            }
        }

        Product savedProduct = productsRepository.save(product);
        return productsMapper.toDTO(savedProduct);
    }

    public ProductsDTO toggleProductionStatus(Long id) {
        Product product = productsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        product.setIsProductionActive(!product.getIsProductionActive());
        Product savedProduct = productsRepository.save(product);
        return productsMapper.toDTO(savedProduct);
    }

    public boolean isProductCodeExists(String productCode, Long excludeId) {
        if (excludeId != null) {
            return productsRepository.existsByProductCodeAndProductIdNot(productCode, excludeId);
        }
        return productsRepository.existsByProductCode(productCode);
    }


    // Lay dinh muc vat tu cho san pham
    public Page<ProductMaterialsDTO> getMaterialsByProduct(Long productId, Pageable pageable) {
        if (!productsRepository.existsById(productId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm với ID: " + productId);
        }
        Page<ProductMaterial> productMaterialsPage = productMaterialsRepository.findByProduct_ProductId(productId, pageable);
        return productMaterialsPage.map(productMaterialsMapper::toDTO);
    }

    public Page<ProductsDTO> getActiveProducts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> productPage = productsRepository.findByIsProductionActiveTrue(pageable);
        return productPage.map(productsMapper::toDTO);
    }


}
