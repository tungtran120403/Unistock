//package vn.unistock.unistockmanagementsystem.features.user.productMaterials;
//
//import lombok.RequiredArgsConstructor;
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.Pageable;
//import org.springframework.http.HttpStatus;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//import org.springframework.web.server.ResponseStatusException;
//import vn.unistock.unistockmanagementsystem.entities.Material;
//import vn.unistock.unistockmanagementsystem.entities.Product;
//import vn.unistock.unistockmanagementsystem.entities.ProductMaterial;
//import vn.unistock.unistockmanagementsystem.features.user.materials.MaterialsRepository;
//import vn.unistock.unistockmanagementsystem.features.user.products.ProductMaterialsDTO;
//import vn.unistock.unistockmanagementsystem.features.user.products.ProductMaterialsMapper;
//import vn.unistock.unistockmanagementsystem.features.user.products.ProductMaterialsRepository;
//import vn.unistock.unistockmanagementsystem.features.user.products.ProductsRepository;
//
//import java.util.List;
//import java.util.Objects;
//import java.util.Optional;
//import java.util.stream.Collectors;
//
//@Service
//@RequiredArgsConstructor
//public class ProductMaterialsService {
//    private final ProductMaterialsRepository productMaterialRepository;
//    private final ProductsRepository productRepository;
//    private final MaterialsRepository materialRepository;
//    private final ProductMaterialsMapper productMaterialMapper;
//
//    public Page<ProductMaterialsDTO> getMaterialsByProduct(Long productId, Pageable pageable) {
//        if (!productRepository.existsById(productId)) {
//            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm với ID: " + productId);
//        }
//        Page<ProductMater3ial> productMaterialsPage = productMaterialRepository.findByProduct_ProductId(productId, pageable);
//        return productMaterialsPage.map(productMaterialMapper::toDTO);
//    }
//
//    @Transactional
//    public void saveProductMaterials(Long productId, List<ProductMaterialsDTO> materialsDTOList) {
//        // Kiểm tra xem Product có tồn tại hay không
//        Product product = productRepository.findById(productId)
//                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm với ID: " + productId));
//
//        for (ProductMaterialsDTO dto : materialsDTOList) {
//            // Kiểm tra xem Material có tồn tại không
//            Material material = materialRepository.findById(dto.getMaterialId())
//                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nguyên vật liệu với ID: " + dto.getMaterialId()));
//
//            Optional<ProductMaterial> existingMaterial = productMaterialRepository.findByProductIdAndMaterialId(productId, dto.getMaterialId());
//
//            if (existingMaterial.isPresent()) {
//                ProductMaterial materialEntity = existingMaterial.get();
//                if (!Objects.equals(materialEntity.getQuantity(), dto.getQuantity())) {
//                    materialEntity.setQuantity(dto.getQuantity());
//                    productMaterialRepository.save(materialEntity);
//                }
//            } else {
//                ProductMaterial newMaterial = productMaterialMapper.toEntity(dto);
//                newMaterial.setProduct(product);
//                newMaterial.setMaterial(material);
//                productMaterialRepository.save(newMaterial);
//                productMaterialRepository.save(newMaterial);
//            }
//        }
//    }
//
//    @Transactional
//    public void deleteProductMaterial(Long productId, Long materialId) {
//        // Kiểm tra xem Product có tồn tại không
//        if (!productRepository.existsById(productId)) {
//            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm với ID: " + productId);
//        }
//
//        // Kiểm tra xem Material có tồn tại không
//        if (!materialRepository.existsById(materialId)) {
//            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nguyên vật liệu với ID: " + materialId);
//        }
//
//        // Xóa nếu tồn tại
//        productMaterialRepository.deleteByProductIdAndMaterialId(productId, materialId);
//    }
//
//    public List<ProductMaterialsDTO> getMaterialsBySaleOrderId(Long saleOrderId) {
//        List<ProductMaterial> materials = productMaterialRepository.findBySaleOrderId(saleOrderId);
//        return materials.stream().map(productMaterialMapper::toDTO).collect(Collectors.toList());
//    }
//}
