package vn.unistock.unistockmanagementsystem.features.user.products;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import vn.unistock.unistockmanagementsystem.entities.Material;
import vn.unistock.unistockmanagementsystem.entities.Product;
import vn.unistock.unistockmanagementsystem.entities.ProductMaterial;
import vn.unistock.unistockmanagementsystem.entities.ProductType;
import vn.unistock.unistockmanagementsystem.entities.Unit;
import vn.unistock.unistockmanagementsystem.features.user.materials.MaterialsRepository;
import vn.unistock.unistockmanagementsystem.features.user.productTypes.ProductTypeRepository;
import vn.unistock.unistockmanagementsystem.features.user.units.UnitRepository;
import vn.unistock.unistockmanagementsystem.utils.storage.AzureBlobService;

@ExtendWith(MockitoExtension.class)
public class ProductsServiceTest {

    @Mock
    private ProductsRepository productsRepository;

    @Mock
    private UnitRepository unitRepository;

    @Mock
    private ProductTypeRepository productTypeRepository;

    @Mock
    private MaterialsRepository materialRepository;

    @Mock
    private ProductMaterialsRepository productMaterialsRepository;

    @Mock
    private AzureBlobService azureBlobService;

    @InjectMocks
    private ProductsService productsService;

    @Captor
    private ArgumentCaptor<List<Product>> productsListCaptor;

    @Captor
    private ArgumentCaptor<List<ProductMaterial>> productMaterialsListCaptor;

    @Captor
    private ArgumentCaptor<Product> productCaptor;

    private Product testProduct;
    private Unit testUnit;
    private ProductType testType;
    private Material testMaterial1;
    private Material testMaterial2;
    private ProductMaterial testProductMaterial1;
    private MockMultipartFile testImage;
    private List<Product> productList;
    private List<ProductMaterial> productMaterials;

    @BeforeEach
    void setUp() {
        // Khởi tạo đơn vị test
        testUnit = new Unit();
        testUnit.setUnitId(1L);
        testUnit.setUnitName("Cái");

        // Khởi tạo loại sản phẩm test
        testType = new ProductType();
        testType.setTypeId(1L);
        testType.setTypeName("Loại A");

        // Khởi tạo vật liệu test
        testMaterial1 = new Material();
        testMaterial1.setMaterialId(1L);
        testMaterial1.setMaterialName("Vật liệu A");
        testMaterial1.setMaterialCode("M001");

        testMaterial2 = new Material();
        testMaterial2.setMaterialId(2L);
        testMaterial2.setMaterialName("Vật liệu B");
        testMaterial2.setMaterialCode("M002");

        // Khởi tạo sản phẩm test
        testProduct = new Product();
        testProduct.setProductId(1L);
        testProduct.setProductCode("P001");
        testProduct.setProductName("Sản phẩm test");
        testProduct.setDescription("Mô tả sản phẩm test");
        testProduct.setUnit(testUnit);
        testProduct.setProductType(testType);
        testProduct.setIsProductionActive(true);
        testProduct.setImageUrl("http://example.com/image.jpg");

        // Khởi tạo định mức vật liệu
        testProductMaterial1 = new ProductMaterial();
        testProductMaterial1.setId(1L);
        testProductMaterial1.setProduct(testProduct);
        testProductMaterial1.setMaterial(testMaterial1);
        testProductMaterial1.setQuantity(10);

        ProductMaterial testProductMaterial2 = new ProductMaterial();
        testProductMaterial2.setId(2L);
        testProductMaterial2.setProduct(testProduct);
        testProductMaterial2.setMaterial(testMaterial2);
        testProductMaterial2.setQuantity(5);

        productMaterials = new ArrayList<>();
        productMaterials.add(testProductMaterial1);
        productMaterials.add(testProductMaterial2);
        testProduct.setProductMaterials(productMaterials);

        // Khởi tạo DTO vật liệu
        ProductMaterialsDTO material1DTO = new ProductMaterialsDTO();
        material1DTO.setMaterialId(1L);
        material1DTO.setMaterialName("Vật liệu A");
        material1DTO.setMaterialCode("M001");
        material1DTO.setQuantity(10);

        ProductMaterialsDTO material2DTO = new ProductMaterialsDTO();
        material2DTO.setMaterialId(2L);
        material2DTO.setMaterialName("Vật liệu B");
        material2DTO.setMaterialCode("M002");
        material2DTO.setQuantity(5);

        List<ProductMaterialsDTO> testMaterialsDTO = new ArrayList<>();
        testMaterialsDTO.add(material1DTO);
        testMaterialsDTO.add(material2DTO);

        // Khởi tạo DTO sản phẩm
        ProductsDTO testProductDTO = new ProductsDTO();
        testProductDTO.setProductId(1L);
        testProductDTO.setProductCode("P001");
        testProductDTO.setProductName("Sản phẩm test");
        testProductDTO.setDescription("Mô tả sản phẩm test");
        testProductDTO.setUnitId(1L);
        testProductDTO.setUnitName("Cái");
        testProductDTO.setTypeId(1L);
        testProductDTO.setTypeName("Loại A");
        testProductDTO.setIsProductionActive(true);
        testProductDTO.setImageUrl("http://example.com/image.jpg");
        testProductDTO.setMaterials(testMaterialsDTO);

        // Khởi tạo file ảnh test
        testImage = new MockMultipartFile(
                "image",
                "test-image.jpg",
                "image/jpeg",
                "test image content".getBytes()
        );

        // Khởi tạo danh sách sản phẩm
        productList = new ArrayList<>();
        productList.add(testProduct);
    }

    @Nested
    @DisplayName("getAllProducts Tests")
    class GetAllProductsTests {

        @Test
        @DisplayName("Lấy danh sách sản phẩm với phân trang thành công")
        void getAllProducts_ReturnsPagedProducts() {
            // Arrange
            int page = 0;
            int size = 10;
            Pageable pageable = PageRequest.of(page, size);
            Page<Product> productPage = new PageImpl<>(productList, pageable, productList.size());
            when(productsRepository.findAll(pageable)).thenReturn(productPage);

            // Act
            Page<ProductsDTO> result = productsService.getAllProducts(page, size);

            // Assert
            assertNotNull(result);
            assertEquals(1, result.getTotalElements());
            assertEquals(1, result.getContent().size());
            assertEquals("P001", result.getContent().get(0).getProductCode());
            verify(productsRepository).findAll(pageable);
        }

        @Test
        @DisplayName("Lấy danh sách sản phẩm với trang rỗng")
        void getAllProducts_ReturnsEmptyPage_WhenNoProducts() {
            // Arrange
            int page = 0;
            int size = 10;
            Pageable pageable = PageRequest.of(page, size);
            Page<Product> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);
            when(productsRepository.findAll(pageable)).thenReturn(emptyPage);

            // Act
            Page<ProductsDTO> result = productsService.getAllProducts(page, size);

            // Assert
            assertNotNull(result);
            assertEquals(0, result.getTotalElements());
            assertTrue(result.getContent().isEmpty());
            verify(productsRepository).findAll(pageable);
        }

        @Test
        @DisplayName("Lấy danh sách sản phẩm với kích thước trang lớn")
        void getAllProducts_ReturnsCorrectPage_WithLargePageSize() {
            // Arrange
            int page = 0;
            int size = 100;
            Pageable pageable = PageRequest.of(page, size);
            Page<Product> productPage = new PageImpl<>(productList, pageable, productList.size());
            when(productsRepository.findAll(pageable)).thenReturn(productPage);

            // Act
            Page<ProductsDTO> result = productsService.getAllProducts(page, size);

            // Assert
            assertNotNull(result);
            assertEquals(1, result.getTotalElements());
            verify(productsRepository).findAll(pageable);
        }

        @Test
        @DisplayName("Lấy danh sách sản phẩm với số trang lớn hơn trang có dữ liệu")
        void getAllProducts_ReturnsEmptyPage_WithExceedingPageNumber() {
            // Arrange
            int page = 10; // Trang vượt quá dữ liệu
            int size = 10;
            Pageable pageable = PageRequest.of(page, size);
            Page<Product> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);
            when(productsRepository.findAll(pageable)).thenReturn(emptyPage);

            // Act
            Page<ProductsDTO> result = productsService.getAllProducts(page, size);

            // Assert
            assertNotNull(result);
            assertEquals(0, result.getTotalElements());
            assertTrue(result.getContent().isEmpty());
            verify(productsRepository).findAll(pageable);
        }

        @Test
        @DisplayName("Lấy danh sách sản phẩm với size = 0")
        void getAllProducts_WithZeroSize() {
            // Arrange
            int page = 0;
            int size = 0; // Size không hợp lệ
            Pageable pageable = PageRequest.of(page, size);
            Page<Product> productPage = new PageImpl<>(Collections.emptyList(), pageable, 0);
            when(productsRepository.findAll(pageable)).thenReturn(productPage);

            // Act
            Page<ProductsDTO> result = productsService.getAllProducts(page, size);

            // Assert
            assertNotNull(result);
            assertEquals(0, result.getTotalElements());
            verify(productsRepository).findAll(pageable);
        }

        @Test
        @DisplayName("Lấy danh sách sản phẩm với negative page")
        void getAllProducts_WithNegativePage() {
            // Arrange
            int page = -1; // Page không hợp lệ
            int size = 10;

            // Act & Assert
            assertThrows(IllegalArgumentException.class,
                    () -> productsService.getAllProducts(page, size));
            verify(productsRepository, never()).findAll(any(Pageable.class));
        }

        @Test
        @DisplayName("Lấy danh sách sản phẩm với nhiều sản phẩm")
        void getAllProducts_WithMultipleProducts() {
            // Arrange
            int page = 0;
            int size = 10;
            Pageable pageable = PageRequest.of(page, size);

            List<Product> multipleProducts = new ArrayList<>();
            for (int i = 1; i <= 5; i++) {
                Product product = new Product();
                product.setProductId((long) i);
                product.setProductCode("P00" + i);
                product.setProductName("Sản phẩm " + i);
                product.setUnit(testUnit);
                product.setProductType(testType);
                multipleProducts.add(product);
            }

            Page<Product> productPage = new PageImpl<>(multipleProducts, pageable, multipleProducts.size());
            when(productsRepository.findAll(pageable)).thenReturn(productPage);

            // Act
            Page<ProductsDTO> result = productsService.getAllProducts(page, size);

            // Assert
            assertNotNull(result);
            assertEquals(5, result.getTotalElements());
            assertEquals(5, result.getContent().size());
            assertEquals("P001", result.getContent().get(0).getProductCode());
            assertEquals("P005", result.getContent().get(4).getProductCode());
            verify(productsRepository).findAll(pageable);
        }
    }

    @Nested
    @DisplayName("getProductById Tests")
    class GetProductByIdTests {

        @Test
        @DisplayName("Lấy sản phẩm theo ID hợp lệ thành công")
        void getProductById_ReturnsProduct_WithValidId() {
            // Arrange
            Long productId = 1L;
            when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));

            // Act
            ProductsDTO result = productsService.getProductById(productId);

            // Assert
            assertNotNull(result);
            assertEquals("P001", result.getProductCode());
            assertEquals("Sản phẩm test", result.getProductName());
            assertEquals(1L, result.getUnitId());
            assertEquals("Cái", result.getUnitName());
            assertEquals(1L, result.getTypeId());
            assertEquals("Loại A", result.getTypeName());
            assertEquals(true, result.getIsProductionActive());
            verify(productsRepository).findById(productId);
        }

        @Test
        @DisplayName("Lấy sản phẩm với ID không tồn tại")
        void getProductById_ThrowsException_WithNonExistentId() {
            // Arrange
            Long nonExistentId = 999L;
            when(productsRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> productsService.getProductById(nonExistentId)
            );
            assertTrue(exception.getMessage().contains("Không tìm thấy sản phẩm với ID"));
            verify(productsRepository).findById(nonExistentId);
        }

        @Test
        @DisplayName("Lấy sản phẩm với ID null")
        void getProductById_ThrowsException_WithNullId() {
            // Act & Assert
            assertThrows(
                    NullPointerException.class,
                    () -> productsService.getProductById(null)
            );
            verify(productsRepository, never()).findById(null);
        }

        @Test
        @DisplayName("Lấy sản phẩm với ID âm")
        void getProductById_ThrowsException_WithNegativeId() {
            // Arrange
            Long negativeId = -1L;
            when(productsRepository.findById(negativeId)).thenReturn(Optional.empty());

            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> productsService.getProductById(negativeId)
            );
            assertTrue(exception.getMessage().contains("Không tìm thấy sản phẩm với ID"));
            verify(productsRepository).findById(negativeId);
        }

        @Test
        @DisplayName("Lấy sản phẩm với ID 0")
        void getProductById_ThrowsException_WithZeroId() {
            // Arrange
            Long zeroId = 0L;
            when(productsRepository.findById(zeroId)).thenReturn(Optional.empty());

            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> productsService.getProductById(zeroId)
            );
            assertTrue(exception.getMessage().contains("Không tìm thấy sản phẩm với ID"));
            verify(productsRepository).findById(zeroId);
        }

        @Test
        @DisplayName("Lấy sản phẩm với đầy đủ danh sách vật liệu")
        void getProductById_ReturnsProductWithMaterials() {
            // Arrange
            Long productId = 1L;

            // Đảm bảo sản phẩm test có danh sách vật liệu
            testProduct.setProductMaterials(productMaterials);

            when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));

            // Act
            ProductsDTO result = productsService.getProductById(productId);

            // Assert
            assertNotNull(result);
            assertNotNull(result.getMaterials());
            assertEquals(2, result.getMaterials().size());
            assertEquals(1L, result.getMaterials().get(0).getMaterialId());
            assertEquals(10, result.getMaterials().get(0).getQuantity());
            assertEquals(2L, result.getMaterials().get(1).getMaterialId());
            assertEquals(5, result.getMaterials().get(1).getQuantity());
            verify(productsRepository).findById(productId);
        }

        @Test
        @DisplayName("Lấy sản phẩm không có vật liệu")
        void getProductById_ReturnsProductWithNoMaterials() {
            // Arrange
            Long productId = 1L;

            // Đặt danh sách vật liệu trống
            testProduct.setProductMaterials(Collections.emptyList());

            when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));

            // Act
            ProductsDTO result = productsService.getProductById(productId);

            // Assert
            assertNotNull(result);
            assertNotNull(result.getMaterials());
            assertTrue(result.getMaterials().isEmpty());
            verify(productsRepository).findById(productId);
        }

        @ParameterizedTest
        @ValueSource(longs = {Long.MAX_VALUE, Long.MIN_VALUE})
        @DisplayName("Lấy sản phẩm với ID biên")
        void getProductById_WithBoundaryId(Long boundaryId) {
            // Arrange
            when(productsRepository.findById(boundaryId)).thenReturn(Optional.empty());

            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> productsService.getProductById(boundaryId)
            );
            assertTrue(exception.getMessage().contains("Không tìm thấy sản phẩm với ID"));
            verify(productsRepository).findById(boundaryId);
        }
    }

    @Nested
    @DisplayName("createProduct Tests")
    class CreateProductTests {

        @Test
        @DisplayName("Tạo sản phẩm mới thành công không có vật liệu")
        void createProduct_Success_WithoutMaterials() throws IOException {
            // Arrange
            ProductsDTO newProductDTO = new ProductsDTO();
            newProductDTO.setProductCode("NEW001");
            newProductDTO.setProductName("Sản phẩm mới");
            newProductDTO.setDescription("Mô tả sản phẩm mới");
            newProductDTO.setUnitId(1L);
            newProductDTO.setTypeId(1L);
            newProductDTO.setIsProductionActive(true);
            newProductDTO.setImage(testImage);

            when(productsRepository.existsByProductCode("NEW001")).thenReturn(false);
            when(unitRepository.findById(1L)).thenReturn(Optional.of(testUnit));
            when(productTypeRepository.findById(1L)).thenReturn(Optional.of(testType));
            when(azureBlobService.uploadFile(any(MultipartFile.class))).thenReturn("http://new-image.jpg");
            when(productsRepository.save(any(Product.class))).thenReturn(testProduct);

            // Act
            Product result = productsService.createProduct(newProductDTO, "Admin");

            // Assert
            assertNotNull(result);
            assertEquals(testProduct, result);
            verify(productsRepository).existsByProductCode("NEW001");
            verify(unitRepository).findById(1L);
            verify(productTypeRepository).findById(1L);
            verify(azureBlobService).uploadFile(any(MultipartFile.class));
            verify(productsRepository).save(any(Product.class));
            verify(productMaterialsRepository, never()).saveAll(anyList());
        }

        @Test
        @DisplayName("Tạo sản phẩm mới thành công có vật liệu")
        void createProduct_Success_WithMaterials() throws IOException {
            // Arrange
            ProductMaterialsDTO materialDTO = new ProductMaterialsDTO();
            materialDTO.setMaterialId(1L);
            materialDTO.setMaterialName("Vật liệu A");
            materialDTO.setQuantity(10);

            ProductsDTO newProductDTO = new ProductsDTO();
            newProductDTO.setProductCode("NEW001");
            newProductDTO.setProductName("Sản phẩm mới");
            newProductDTO.setDescription("Mô tả sản phẩm mới");
            newProductDTO.setUnitId(1L);
            newProductDTO.setTypeId(1L);
            newProductDTO.setIsProductionActive(true);
            newProductDTO.setImage(testImage);
            newProductDTO.setMaterials(Collections.singletonList(materialDTO));

            when(productsRepository.existsByProductCode("NEW001")).thenReturn(false);
            when(unitRepository.findById(1L)).thenReturn(Optional.of(testUnit));
            when(productTypeRepository.findById(1L)).thenReturn(Optional.of(testType));
            when(azureBlobService.uploadFile(any(MultipartFile.class))).thenReturn("http://new-image.jpg");
            when(productsRepository.save(any(Product.class))).thenReturn(testProduct);
            when(materialRepository.findById(1L)).thenReturn(Optional.of(testMaterial1));
            when(productMaterialsRepository.saveAll(anyList())).thenReturn(Collections.singletonList(testProductMaterial1));

            // Act
            Product result = productsService.createProduct(newProductDTO, "Admin");

            // Assert
            assertNotNull(result);
            assertEquals(testProduct, result);
            verify(productsRepository).existsByProductCode("NEW001");
            verify(unitRepository).findById(1L);
            verify(productTypeRepository).findById(1L);
            verify(azureBlobService).uploadFile(any(MultipartFile.class));
            verify(productsRepository).save(any(Product.class));
            verify(materialRepository).findById(1L);
            verify(productMaterialsRepository).saveAll(anyList());
        }

        @Test
        @DisplayName("Tạo sản phẩm với mã đã tồn tại")
        void createProduct_ThrowsException_WithExistingProductCode() {
            // Arrange
            ProductsDTO newProductDTO = new ProductsDTO();
            newProductDTO.setProductCode("P001"); // Mã đã tồn tại
            newProductDTO.setProductName("Sản phẩm mới");

            when(productsRepository.existsByProductCode("P001")).thenReturn(true);

            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> productsService.createProduct(newProductDTO, "Admin")
            );
            assertEquals("Mã sản phẩm đã tồn tại!", exception.getMessage());
            verify(productsRepository).existsByProductCode("P001");
            verify(productsRepository, never()).save(any(Product.class));
        }

        @Test
        @DisplayName("Tạo sản phẩm với đơn vị không tồn tại")
        void createProduct_ThrowsException_WithNonExistentUnit() {
            // Arrange
            ProductsDTO newProductDTO = new ProductsDTO();
            newProductDTO.setProductCode("NEW001");
            newProductDTO.setProductName("Sản phẩm mới");
            newProductDTO.setUnitId(999L); // ID đơn vị không tồn tại

            when(productsRepository.existsByProductCode("NEW001")).thenReturn(false);
            when(unitRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> productsService.createProduct(newProductDTO, "Admin")
            );
            assertEquals("Đơn vị không tồn tại!", exception.getMessage());
            verify(productsRepository).existsByProductCode("NEW001");
            verify(unitRepository).findById(999L);
            verify(productsRepository, never()).save(any(Product.class));
        }

        @Test
        @DisplayName("Tạo sản phẩm với loại sản phẩm không tồn tại")
        void createProduct_ThrowsException_WithNonExistentProductType() {
            // Arrange
            ProductsDTO newProductDTO = new ProductsDTO();
            newProductDTO.setProductCode("NEW001");
            newProductDTO.setProductName("Sản phẩm mới");
            newProductDTO.setUnitId(1L);
            newProductDTO.setTypeId(999L); // ID loại sản phẩm không tồn tại

            when(productsRepository.existsByProductCode("NEW001")).thenReturn(false);
            when(unitRepository.findById(1L)).thenReturn(Optional.of(testUnit));
            when(productTypeRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> productsService.createProduct(newProductDTO, "Admin")
            );
            assertEquals("Loại sản phẩm không tồn tại!", exception.getMessage());
            verify(productsRepository).existsByProductCode("NEW001");
            verify(unitRepository).findById(1L);
            verify(productTypeRepository).findById(999L);
            verify(productsRepository, never()).save(any(Product.class));
        }

        @Test
        @DisplayName("Tạo sản phẩm với vật liệu không tồn tại")
        void createProduct_ThrowsException_WithNonExistentMaterial() throws IOException {
            // Arrange
            ProductMaterialsDTO materialDTO = new ProductMaterialsDTO();
            materialDTO.setMaterialId(999L); // ID vật liệu không tồn tại
            materialDTO.setQuantity(10);

            ProductsDTO newProductDTO = new ProductsDTO();
            newProductDTO.setProductCode("NEW001");
            newProductDTO.setProductName("Sản phẩm mới");
            newProductDTO.setUnitId(1L);
            newProductDTO.setTypeId(1L);
            newProductDTO.setMaterials(Collections.singletonList(materialDTO));

            Product savedProduct = new Product();
            savedProduct.setProductId(2L);
            savedProduct.setProductCode("NEW001");

            when(productsRepository.existsByProductCode("NEW001")).thenReturn(false);
            when(unitRepository.findById(1L)).thenReturn(Optional.of(testUnit));
            when(productTypeRepository.findById(1L)).thenReturn(Optional.of(testType));
            when(productsRepository.save(any(Product.class))).thenReturn(savedProduct);
            when(materialRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> productsService.createProduct(newProductDTO, "Admin")
            );
            assertEquals("Nguyên vật liệu không tồn tại!", exception.getMessage());
            verify(productsRepository).save(any(Product.class));
            verify(materialRepository).findById(999L);
            verify(productMaterialsRepository, never()).saveAll(anyList());
        }

        @Test
        @DisplayName("Tạo sản phẩm với tất cả thông tin null")
        void createProduct_WithMinimalInfo() throws IOException {
            // Arrange
            ProductsDTO minimalDTO = new ProductsDTO();
            minimalDTO.setProductCode("MIN001");
            // Không có thông tin khác

            when(productsRepository.existsByProductCode("MIN001")).thenReturn(false);
            when(productsRepository.save(any(Product.class))).thenReturn(testProduct);

            // Act
            Product result = productsService.createProduct(minimalDTO, "Admin");

            // Assert
            assertNotNull(result);
            verify(productsRepository).existsByProductCode("MIN001");
            verify(productsRepository).save(any(Product.class));
        }

        @Test
        @DisplayName("Tạo sản phẩm với ảnh null")
        void createProduct_WithNullImage() throws IOException {
            // Arrange
            ProductsDTO noImageDTO = new ProductsDTO();
            noImageDTO.setProductCode("NOIMG001");
            noImageDTO.setProductName("Sản phẩm không ảnh");
            noImageDTO.setUnitId(1L);
            noImageDTO.setTypeId(1L);
            noImageDTO.setImage(null); // Không có ảnh

            when(productsRepository.existsByProductCode("NOIMG001")).thenReturn(false);
            when(unitRepository.findById(1L)).thenReturn(Optional.of(testUnit));
            when(productTypeRepository.findById(1L)).thenReturn(Optional.of(testType));
            when(productsRepository.save(any(Product.class))).thenReturn(testProduct);

            // Act
            Product result = productsService.createProduct(noImageDTO, "Admin");

            // Assert
            assertNotNull(result);
            verify(productsRepository).save(any(Product.class));
            verify(azureBlobService, never()).uploadFile(any(MultipartFile.class));
        }

        @Test
        @DisplayName("Tạo sản phẩm với danh sách vật liệu rỗng")
        void createProduct_WithEmptyMaterialsList() throws IOException {
            // Arrange
            ProductsDTO emptyMaterialsDTO = new ProductsDTO();
            emptyMaterialsDTO.setProductCode("EMPTY001");
            emptyMaterialsDTO.setProductName("Sản phẩm không vật liệu");
            emptyMaterialsDTO.setUnitId(1L);
            emptyMaterialsDTO.setTypeId(1L);
            emptyMaterialsDTO.setMaterials(Collections.emptyList()); // Danh sách vật liệu rỗng

            when(productsRepository.existsByProductCode("EMPTY001")).thenReturn(false);
            when(unitRepository.findById(1L)).thenReturn(Optional.of(testUnit));
            when(productTypeRepository.findById(1L)).thenReturn(Optional.of(testType));
            when(productsRepository.save(any(Product.class))).thenReturn(testProduct);

            // Act
            Product result = productsService.createProduct(emptyMaterialsDTO, "Admin");

            // Assert
            assertNotNull(result);
            verify(productsRepository).save(any(Product.class));
            verify(productMaterialsRepository, never()).saveAll(anyList());
        }

        @Test
        @DisplayName("Tạo sản phẩm với mã null")
        void createProduct_WithNullProductCode() {
            // Arrange
            ProductsDTO nullCodeDTO = new ProductsDTO();
            nullCodeDTO.setProductCode(null);
            nullCodeDTO.setProductName("Sản phẩm mã null");

            // Act & Assert
            assertThrows(
                    NullPointerException.class,
                    () -> productsService.createProduct(nullCodeDTO, "Admin")
            );
            verify(productsRepository, never()).save(any(Product.class));
        }

        @Test
        @DisplayName("Tạo sản phẩm với mã rỗng")
        void createProduct_WithEmptyProductCode() throws IOException {
            // Arrange
            ProductsDTO emptyCodeDTO = new ProductsDTO();
            emptyCodeDTO.setProductCode("");
            emptyCodeDTO.setProductName("Sản phẩm mã rỗng");

            when(productsRepository.existsByProductCode("")).thenReturn(false);
            when(productsRepository.save(any(Product.class))).thenReturn(testProduct);

            // Act
            Product result = productsService.createProduct(emptyCodeDTO, "Admin");

            // Assert
            assertNotNull(result);
            verify(productsRepository).existsByProductCode("");
            verify(productsRepository).save(any(Product.class));
        }

        @Test
        @DisplayName("Tạo sản phẩm với nhiều vật liệu")
        void createProduct_WithMultipleMaterials() throws IOException {
            // Arrange
            List<ProductMaterialsDTO> materialDTOs = new ArrayList<>();

            ProductMaterialsDTO materialDTO1 = new ProductMaterialsDTO();
            materialDTO1.setMaterialId(1L);
            materialDTO1.setMaterialName("Vật liệu A");
            materialDTO1.setQuantity(10);
            materialDTOs.add(materialDTO1);

            ProductMaterialsDTO materialDTO2 = new ProductMaterialsDTO();
            materialDTO2.setMaterialId(2L);
            materialDTO2.setMaterialName("Vật liệu B");
            materialDTO2.setQuantity(5);
            materialDTOs.add(materialDTO2);

            ProductMaterialsDTO materialDTO3 = new ProductMaterialsDTO();
            materialDTO3.setMaterialId(3L);
            materialDTO3.setMaterialName("Vật liệu C");
            materialDTO3.setQuantity(2);
            materialDTOs.add(materialDTO3);

            ProductsDTO newProductDTO = new ProductsDTO();
            newProductDTO.setProductCode("MULTI001");
            newProductDTO.setProductName("Sản phẩm nhiều vật liệu");
            newProductDTO.setUnitId(1L);
            newProductDTO.setTypeId(1L);
            newProductDTO.setMaterials(materialDTOs);

            Material material3 = new Material();
            material3.setMaterialId(3L);
            material3.setMaterialName("Vật liệu C");

            when(productsRepository.existsByProductCode("MULTI001")).thenReturn(false);
            when(unitRepository.findById(1L)).thenReturn(Optional.of(testUnit));
            when(productTypeRepository.findById(1L)).thenReturn(Optional.of(testType));
            when(productsRepository.save(any(Product.class))).thenReturn(testProduct);
            when(materialRepository.findById(1L)).thenReturn(Optional.of(testMaterial1));
            when(materialRepository.findById(2L)).thenReturn(Optional.of(testMaterial2));
            when(materialRepository.findById(3L)).thenReturn(Optional.of(material3));
            when(productMaterialsRepository.saveAll(anyList())).thenReturn(productMaterials);

            // Act
            Product result = productsService.createProduct(newProductDTO, "Admin");

            // Assert
            assertNotNull(result);
            verify(productsRepository).existsByProductCode("MULTI001");
            verify(materialRepository).findById(1L);
            verify(materialRepository).findById(2L);
            verify(materialRepository).findById(3L);
            verify(productMaterialsRepository).saveAll(productMaterialsListCaptor.capture());

            List<ProductMaterial> capturedMaterials = productMaterialsListCaptor.getValue();
            assertEquals(3, capturedMaterials.size());
        }

        @Test
        @DisplayName("Tạo sản phẩm với ảnh không hợp lệ")
        void createProduct_WithInvalidImage() throws IOException {
            // Arrange
            ProductsDTO newProductDTO = new ProductsDTO();
            newProductDTO.setProductCode("IMG001");
            newProductDTO.setProductName("Sản phẩm ảnh lỗi");

            // Mock ảnh lỗi
            MockMultipartFile invalidImage = new MockMultipartFile(
                    "image",
                    "invalid.txt", // Không phải file ảnh
                    "text/plain",
                    "this is not an image".getBytes()
            );
            newProductDTO.setImage(invalidImage);

            when(productsRepository.existsByProductCode("IMG001")).thenReturn(false);
            when(azureBlobService.uploadFile(invalidImage)).thenThrow(new IOException("Invalid image format"));

            // Act & Assert
            assertThrows(
                    IOException.class,
                    () -> productsService.createProduct(newProductDTO, "Admin")
            );
            verify(productsRepository).existsByProductCode("IMG001");
            verify(azureBlobService).uploadFile(invalidImage);
            verify(productsRepository, never()).save(any(Product.class));
        }

        @Test
        @DisplayName("Tạo sản phẩm với trạng thái sản xuất null")
        void createProduct_WithNullProductionStatus() throws IOException {
            // Arrange
            ProductsDTO nullStatusDTO = new ProductsDTO();
            nullStatusDTO.setProductCode("NULL001");
            nullStatusDTO.setProductName("Sản phẩm trạng thái null");
            nullStatusDTO.setIsProductionActive(null); // Trạng thái null

            when(productsRepository.existsByProductCode("NULL001")).thenReturn(false);
            when(productsRepository.save(any(Product.class))).thenReturn(testProduct);

            // Act
            Product result = productsService.createProduct(nullStatusDTO, "Admin");

            // Assert
            assertNotNull(result);
            verify(productsRepository).save(productCaptor.capture());
            Product savedProduct = productCaptor.getValue();
            assertTrue(savedProduct.getIsProductionActive()); // Mặc định là true
        }

        @Test
        @DisplayName("Tạo sản phẩm với mã trùng lặp (case-sensitive)")
        void createProduct_WithCaseSensitiveCode() {
            // Arrange
            ProductsDTO lowerCaseDTO = new ProductsDTO();
            lowerCaseDTO.setProductCode("p001"); // Chữ thường, khác với P001 đã tồn tại
            lowerCaseDTO.setProductName("Sản phẩm chữ thường");

            // Kiểm tra cả hai trường hợp
            when(productsRepository.existsByProductCode("p001")).thenReturn(true); // Giả định hệ thống không phân biệt hoa thường

            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> productsService.createProduct(lowerCaseDTO, "Admin")
            );
            assertEquals("Mã sản phẩm đã tồn tại!", exception.getMessage());
            verify(productsRepository).existsByProductCode("p001");
            verify(productsRepository, never()).save(any(Product.class));
        }
    }

    @Nested
    @DisplayName("updateProduct Tests")
    class UpdateProductTests {

        @Test
        @DisplayName("Cập nhật sản phẩm thành công")
        void updateProduct_Success() throws IOException {
            // Arrange
            Long productId = 1L;
            ProductsDTO updatedDTO = new ProductsDTO();
            updatedDTO.setProductCode("P001");
            updatedDTO.setProductName("Sản phẩm đã cập nhật");
            updatedDTO.setDescription("Mô tả đã cập nhật");
            updatedDTO.setUnitId(1L);
            updatedDTO.setTypeId(1L);
            updatedDTO.setIsProductionActive(true);

            when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(unitRepository.findById(1L)).thenReturn(Optional.of(testUnit));
            when(productTypeRepository.findById(1L)).thenReturn(Optional.of(testType));
            when(productsRepository.save(any(Product.class))).thenReturn(testProduct);

            // Act
            ProductsDTO result = productsService.updateProduct(productId, updatedDTO, null);

            // Assert
            assertNotNull(result);
            assertEquals("Sản phẩm đã cập nhật", testProduct.getProductName());
            assertEquals("Mô tả đã cập nhật", testProduct.getDescription());
            verify(productsRepository).findById(productId);
            verify(unitRepository).findById(1L);
            verify(productTypeRepository).findById(1L);
            verify(productsRepository).save(testProduct);
        }

        @Test
        @DisplayName("Cập nhật sản phẩm với ảnh mới")
        void updateProduct_WithNewImage_Success() throws IOException {
            // Arrange
            Long productId = 1L;
            ProductsDTO updatedDTO = new ProductsDTO();
            updatedDTO.setProductCode("P001");
            updatedDTO.setProductName("Sản phẩm đã cập nhật");

            MockMultipartFile newImage = new MockMultipartFile(
                    "newImage",
                    "new-image.jpg",
                    "image/jpeg",
                    "new image content".getBytes()
            );

            when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(azureBlobService.uploadFile(newImage)).thenReturn("http://new-image.jpg");
            when(productsRepository.save(any(Product.class))).thenReturn(testProduct);

            // Act
            ProductsDTO result = productsService.updateProduct(productId, updatedDTO, newImage);

            // Assert
            assertNotNull(result);
            assertEquals("http://new-image.jpg", testProduct.getImageUrl());
            verify(productsRepository).findById(productId);
            verify(azureBlobService).deleteFile(testProduct.getImageUrl());
            verify(azureBlobService).uploadFile(newImage);
            verify(productsRepository).save(testProduct);
        }

        @Test
        @DisplayName("Cập nhật mã sản phẩm đã tồn tại")
        void updateProduct_ThrowsException_WithExistingProductCode() {
            // Arrange
            Long productId = 1L;
            Product existingProduct = new Product();
            existingProduct.setProductId(productId);
            existingProduct.setProductCode("P001");

            ProductsDTO updatedDTO = new ProductsDTO();
            updatedDTO.setProductCode("P002"); // Mã mới khác với mã hiện tại

            when(productsRepository.findById(productId)).thenReturn(Optional.of(existingProduct));
            when(productsRepository.existsByProductCode("P002")).thenReturn(true);

            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> productsService.updateProduct(productId, updatedDTO, null)
            );
            assertEquals("Mã sản phẩm đã tồn tại!", exception.getMessage());
            verify(productsRepository).findById(productId);
            verify(productsRepository).existsByProductCode("P002");
            verify(productsRepository, never()).save(any(Product.class));
        }

        @Test
        @DisplayName("Cập nhật sản phẩm không tồn tại")
        void updateProduct_ThrowsException_WithNonExistentProduct() {
            // Arrange
            Long nonExistentId = 999L;
            ProductsDTO updatedDTO = new ProductsDTO();
            updatedDTO.setProductCode("P999");

            when(productsRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            // Act & Assert
            RuntimeException exception = assertThrows(
                    RuntimeException.class,
                    () -> productsService.updateProduct(nonExistentId, updatedDTO, null)
            );
            assertEquals("Không tìm thấy sản phẩm", exception.getMessage());
            verify(productsRepository).findById(nonExistentId);
            verify(productsRepository, never()).save(any(Product.class));
        }

        @Test
        @DisplayName("Cập nhật sản phẩm với đơn vị không tồn tại")
        void updateProduct_ThrowsException_WithNonExistentUnit() {
            // Arrange
            Long productId = 1L;
            ProductsDTO updatedDTO = new ProductsDTO();
            updatedDTO.setProductCode("P001");
            updatedDTO.setUnitId(999L); // ID đơn vị không tồn tại

            when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(unitRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> productsService.updateProduct(productId, updatedDTO, null)
            );
            assertEquals("Đơn vị không tồn tại!", exception.getMessage());
            verify(productsRepository).findById(productId);
            verify(unitRepository).findById(999L);
            verify(productsRepository, never()).save(any(Product.class));
        }

        @Test
        @DisplayName("Cập nhật sản phẩm với loại sản phẩm không tồn tại")
        void updateProduct_ThrowsException_WithNonExistentProductType() {
            // Arrange
            Long productId = 1L;
            ProductsDTO updatedDTO = new ProductsDTO();
            updatedDTO.setProductCode("P001");
            updatedDTO.setUnitId(1L);
            updatedDTO.setTypeId(999L); // ID loại sản phẩm không tồn tại

            when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(unitRepository.findById(1L)).thenReturn(Optional.of(testUnit));
            when(productTypeRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> productsService.updateProduct(productId, updatedDTO, null)
            );
            assertEquals("Loại sản phẩm không tồn tại!", exception.getMessage());
            verify(productsRepository).findById(productId);
            verify(unitRepository).findById(1L);
            verify(productTypeRepository).findById(999L);
            verify(productsRepository, never()).save(any(Product.class));
        }

        @Test
        @DisplayName("Cập nhật sản phẩm với vật liệu mới")
        void updateProduct_WithNewMaterials_Success() throws IOException {
            // Arrange
            Long productId = 1L;
            ProductMaterialsDTO newMaterialDTO = new ProductMaterialsDTO();
            newMaterialDTO.setMaterialId(2L);
            newMaterialDTO.setMaterialName("Vật liệu B");
            newMaterialDTO.setQuantity(5);

            ProductsDTO updatedDTO = new ProductsDTO();
            updatedDTO.setProductCode("P001");
            updatedDTO.setProductName("Sản phẩm đã cập nhật");
            updatedDTO.setMaterials(Collections.singletonList(newMaterialDTO));

            when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(materialRepository.findById(2L)).thenReturn(Optional.of(testMaterial2));
            when(productsRepository.save(any(Product.class))).thenReturn(testProduct);

            // Act
            ProductsDTO result = productsService.updateProduct(productId, updatedDTO, null);

            // Assert
            assertNotNull(result);
            verify(productsRepository).findById(productId);
            verify(materialRepository).findById(2L);
            verify(productMaterialsRepository).deleteAll(anyList());
            verify(productsRepository).save(testProduct);
        }

        @Test
        @DisplayName("Cập nhật sản phẩm và xóa tất cả vật liệu hiện có")
        void updateProduct_RemoveAllMaterials_Success() throws IOException {
            // Arrange
            Long productId = 1L;
            ProductsDTO updatedDTO = new ProductsDTO();
            updatedDTO.setProductCode("P001");
            updatedDTO.setProductName("Sản phẩm đã cập nhật");
            updatedDTO.setMaterials(Collections.emptyList()); // Danh sách vật liệu trống

            when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(productsRepository.save(any(Product.class))).thenReturn(testProduct);

            // Act
            ProductsDTO result = productsService.updateProduct(productId, updatedDTO, null);

            // Assert
            assertNotNull(result);
            verify(productsRepository).findById(productId);
            verify(productMaterialsRepository).deleteAll(anyList());
            verify(productsRepository).save(testProduct);
        }

        @Test
        @DisplayName("Cập nhật sản phẩm với vật liệu không tồn tại")
        void updateProduct_ThrowsException_WithNonExistentMaterial() {
            // Arrange
            Long productId = 1L;
            ProductMaterialsDTO nonExistentMaterialDTO = new ProductMaterialsDTO();
            nonExistentMaterialDTO.setMaterialId(999L); // ID vật liệu không tồn tại
            nonExistentMaterialDTO.setQuantity(5);

            ProductsDTO updatedDTO = new ProductsDTO();
            updatedDTO.setProductCode("P001");
            updatedDTO.setProductName("Sản phẩm đã cập nhật");
            updatedDTO.setMaterials(Collections.singletonList(nonExistentMaterialDTO));

            when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(materialRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> productsService.updateProduct(productId, updatedDTO, null)
            );
            assertEquals("Nguyên vật liệu không tồn tại!", exception.getMessage());
            verify(productsRepository).findById(productId);
            verify(materialRepository).findById(999L);
        }

        @Test
        @DisplayName("Cập nhật sản phẩm với mã null")
        void updateProduct_WithNullProductCode() {
            // Arrange
            Long productId = 1L;
            ProductsDTO nullCodeDTO = new ProductsDTO();
            nullCodeDTO.setProductCode(null);

            when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));

            // Act & Assert
            assertThrows(
                    NullPointerException.class,
                    () -> productsService.updateProduct(productId, nullCodeDTO, null)
            );
            verify(productsRepository).findById(productId);
            verify(productsRepository, never()).save(any(Product.class));
        }

        @Test
        @DisplayName("Cập nhật sản phẩm chỉ thay đổi trạng thái sản xuất")
        void updateProduct_OnlyChangeProductionStatus() throws IOException {
            // Arrange
            Long productId = 1L;
            testProduct.setIsProductionActive(true);

            ProductsDTO statusDTO = new ProductsDTO();
            statusDTO.setProductCode("P001");
            statusDTO.setIsProductionActive(false);

            when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(productsRepository.save(any(Product.class))).thenReturn(testProduct);

            // Act
            ProductsDTO result = productsService.updateProduct(productId, statusDTO, null);

            // Assert
            assertNotNull(result);
            assertFalse(testProduct.getIsProductionActive());
            verify(productsRepository).findById(productId);
            verify(productsRepository).save(testProduct);
        }

        @Test
        @DisplayName("Cập nhật sản phẩm với ảnh không hợp lệ")
        void updateProduct_WithInvalidImage() throws IOException {
            // Arrange
            Long productId = 1L;
            ProductsDTO updatedDTO = new ProductsDTO();
            updatedDTO.setProductCode("P001");

            MockMultipartFile invalidImage = new MockMultipartFile(
                    "image",
                    "invalid.txt", // Không phải file ảnh
                    "text/plain",
                    "this is not an image".getBytes()
            );

            when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            doThrow(new IOException("Failed to delete old image")).when(azureBlobService).deleteFile(anyString());
            when(azureBlobService.uploadFile(invalidImage)).thenThrow(new IOException("Invalid image format"));

            // Act & Assert
            assertThrows(
                    IOException.class,
                    () -> productsService.updateProduct(productId, updatedDTO, invalidImage)
            );
            verify(productsRepository).findById(productId);
        }

        @Test
        @DisplayName("Cập nhật sản phẩm với ảnh mới và xóa ảnh cũ thất bại")
        void updateProduct_WithNewImageAndFailedToDeleteOld() throws IOException {
            // Arrange
            Long productId = 1L;
            ProductsDTO updatedDTO = new ProductsDTO();
            updatedDTO.setProductCode("P001");

            MockMultipartFile newImage = new MockMultipartFile(
                    "image",
                    "new-image.jpg",
                    "image/jpeg",
                    "new image content".getBytes()
            );

            when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            doThrow(new IOException("Failed to delete old image")).when(azureBlobService).deleteFile(anyString());

            // Act & Assert
            assertThrows(
                    IOException.class,
                    () -> productsService.updateProduct(productId, updatedDTO, newImage)
            );
            verify(productsRepository).findById(productId);
            verify(azureBlobService).deleteFile(anyString());
            verify(azureBlobService, never()).uploadFile(any(MultipartFile.class));
        }

        @Test
        @DisplayName("Cập nhật sản phẩm với ảnh mới nhưng imageUrl cũ null")
        void updateProduct_WithNewImageAndNullOldImageUrl() throws IOException {
            // Arrange
            Long productId = 1L;
            testProduct.setImageUrl(null); // Không có ảnh cũ

            ProductsDTO updatedDTO = new ProductsDTO();
            updatedDTO.setProductCode("P001");

            MockMultipartFile newImage = new MockMultipartFile(
                    "image",
                    "new-image.jpg",
                    "image/jpeg",
                    "new image content".getBytes()
            );

            when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(azureBlobService.uploadFile(newImage)).thenReturn("http://new-image.jpg");
            when(productsRepository.save(any(Product.class))).thenReturn(testProduct);

            // Act
            ProductsDTO result = productsService.updateProduct(productId, updatedDTO, newImage);

            // Assert
            assertNotNull(result);
            assertEquals("http://new-image.jpg", testProduct.getImageUrl());
            verify(productsRepository).findById(productId);
            verify(azureBlobService, never()).deleteFile(anyString());
            verify(azureBlobService).uploadFile(newImage);
            verify(productsRepository).save(testProduct);
        }

        @Test
        @DisplayName("Cập nhật trạng thái sản xuất từ null sang true")
        void updateProduct_FromNullToTrueProductionStatus() throws IOException {
            // Arrange
            Long productId = 1L;
            testProduct.setIsProductionActive(null);

            ProductsDTO updatedDTO = new ProductsDTO();
            updatedDTO.setProductCode("P001");
            updatedDTO.setIsProductionActive(true);

            when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(productsRepository.save(any(Product.class))).thenReturn(testProduct);

            // Act
            ProductsDTO result = productsService.updateProduct(productId, updatedDTO, null);

            // Assert
            assertNotNull(result);
            assertTrue(testProduct.getIsProductionActive());
            verify(productsRepository).findById(productId);
            verify(productsRepository).save(testProduct);
        }

        @Test
        @DisplayName("Cập nhật sản phẩm với vật liệu null")
        void updateProduct_WithNullMaterials() throws IOException {
            // Arrange
            Long productId = 1L;
            ProductsDTO updatedDTO = new ProductsDTO();
            updatedDTO.setProductCode("P001");
            updatedDTO.setProductName("Sản phẩm đã cập nhật");
            updatedDTO.setMaterials(null); // Danh sách vật liệu null

            when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(productsRepository.save(any(Product.class))).thenReturn(testProduct);

            // Act
            ProductsDTO result = productsService.updateProduct(productId, updatedDTO, null);

            // Assert
            assertNotNull(result);
            verify(productsRepository).findById(productId);
            verify(productMaterialsRepository).deleteAll(anyList());
            verify(productsRepository).save(testProduct);
        }

        @Test
        @DisplayName("Cập nhật vật liệu - thêm, sửa, xóa")
        void updateProduct_AddModifyRemoveMaterials() throws IOException {
            // Arrange
            Long productId = 1L;

            // Vật liệu hiện tại: 1 và 2
            testProduct.setProductMaterials(productMaterials);

            // Vật liệu mới: 1 (đã tồn tại - sửa số lượng), 3 (thêm mới)
            List<ProductMaterialsDTO> updatedMaterials = new ArrayList<>();

            // Vật liệu 1 - sửa số lượng
            ProductMaterialsDTO material1DTO = new ProductMaterialsDTO();
            material1DTO.setMaterialId(1L);
            material1DTO.setQuantity(15); // Thay đổi từ 10.0 -> 15.0
            updatedMaterials.add(material1DTO);

            // Vật liệu 3 - thêm mới
            ProductMaterialsDTO material3DTO = new ProductMaterialsDTO();
            material3DTO.setMaterialId(3L);
            material3DTO.setQuantity(7);
            updatedMaterials.add(material3DTO);

            ProductsDTO updatedDTO = new ProductsDTO();
            updatedDTO.setProductCode("P001");
            updatedDTO.setProductName("Sản phẩm đã cập nhật");
            updatedDTO.setMaterials(updatedMaterials);

            Material material3 = new Material();
            material3.setMaterialId(3L);
            material3.setMaterialName("Vật liệu C");

            when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(materialRepository.findById(1L)).thenReturn(Optional.of(testMaterial1));
            when(materialRepository.findById(3L)).thenReturn(Optional.of(material3));
            when(productsRepository.save(any(Product.class))).thenReturn(testProduct);

            // Act
            ProductsDTO result = productsService.updateProduct(productId, updatedDTO, null);

            // Assert
            assertNotNull(result);
            verify(productsRepository).findById(productId);
            verify(materialRepository).findById(1L);
            verify(materialRepository).findById(3L);
            verify(productMaterialsRepository).deleteAll(anyList());
            verify(productsRepository).save(testProduct);
        }

        @Test
        @DisplayName("Cập nhật với ID null")
        void updateProduct_WithNullId() {
            // Arrange
            ProductsDTO updatedDTO = new ProductsDTO();
            updatedDTO.setProductCode("P001");

            // Act & Assert
            assertThrows(
                    NullPointerException.class,
                    () -> productsService.updateProduct(null, updatedDTO, null)
            );
            verify(productsRepository, never()).findById(any());
            verify(productsRepository, never()).save(any(Product.class));
        }
    }

    @Nested
    @DisplayName("toggleProductionStatus Tests")
    class ToggleProductionStatusTests {

        @Test
        @DisplayName("Bật/tắt trạng thái sản xuất từ true sang false")
        void toggleProductionStatus_FromTrueToFalse_Success() {
            // Arrange
            Long productId = 1L;
            testProduct.setIsProductionActive(true);
            when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(productsRepository.save(testProduct)).thenReturn(testProduct);

            // Act
            ProductsDTO result = productsService.toggleProductionStatus(productId);

            // Assert
            assertNotNull(result);
            assertFalse(testProduct.getIsProductionActive());
            verify(productsRepository).findById(productId);
            verify(productsRepository).save(testProduct);
        }

        @Test
        @DisplayName("Bật/tắt trạng thái sản xuất từ false sang true")
        void toggleProductionStatus_FromFalseToTrue_Success() {
            // Arrange
            Long productId = 1L;
            testProduct.setIsProductionActive(false);
            when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(productsRepository.save(testProduct)).thenReturn(testProduct);

            // Act
            ProductsDTO result = productsService.toggleProductionStatus(productId);

            // Assert
            assertNotNull(result);
            assertTrue(testProduct.getIsProductionActive());
            verify(productsRepository).findById(productId);
            verify(productsRepository).save(testProduct);
        }

        @Test
        @DisplayName("Bật/tắt trạng thái sản xuất với sản phẩm không tồn tại")
        void toggleProductionStatus_ThrowsException_WithNonExistentProduct() {
            // Arrange
            Long nonExistentId = 999L;
            when(productsRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            // Act & Assert
            RuntimeException exception = assertThrows(
                    RuntimeException.class,
                    () -> productsService.toggleProductionStatus(nonExistentId)
            );
            assertEquals("Không tìm thấy sản phẩm", exception.getMessage());
            verify(productsRepository).findById(nonExistentId);
            verify(productsRepository, never()).save(any(Product.class));
        }

        @Test
        @DisplayName("Bật/tắt trạng thái từ null sang true")
        void toggleProductionStatus_FromNullToTrue() {
            // Arrange
            Long productId = 1L;
            testProduct.setIsProductionActive(null);
            when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(productsRepository.save(testProduct)).thenReturn(testProduct);

            // Act
            ProductsDTO result = productsService.toggleProductionStatus(productId);

            // Assert
            assertNotNull(result);
            assertTrue(testProduct.getIsProductionActive());
            verify(productsRepository).findById(productId);
            verify(productsRepository).save(testProduct);
        }

        @Test
        @DisplayName("Bật/tắt trạng thái với ID null")
        void toggleProductionStatus_WithNullId() {
            // Act & Assert
            assertThrows(
                    NullPointerException.class,
                    () -> productsService.toggleProductionStatus(null)
            );
            verify(productsRepository, never()).findById(any());
            verify(productsRepository, never()).save(any(Product.class));
        }

        @Test
        @DisplayName("Bật/tắt trạng thái với ID âm")
        void toggleProductionStatus_WithNegativeId() {
            // Arrange
            Long negativeId = -1L;
            when(productsRepository.findById(negativeId)).thenReturn(Optional.empty());

            // Act & Assert
            RuntimeException exception = assertThrows(
                    RuntimeException.class,
                    () -> productsService.toggleProductionStatus(negativeId)
            );
            assertEquals("Không tìm thấy sản phẩm", exception.getMessage());
            verify(productsRepository).findById(negativeId);
            verify(productsRepository, never()).save(any(Product.class));
        }

        @Test
        @DisplayName("Bật/tắt trạng thái với ID = 0")
        void toggleProductionStatus_WithZeroId() {
            // Arrange
            Long zeroId = 0L;
            when(productsRepository.findById(zeroId)).thenReturn(Optional.empty());

            // Act & Assert
            RuntimeException exception = assertThrows(
                    RuntimeException.class,
                    () -> productsService.toggleProductionStatus(zeroId)
            );
            assertEquals("Không tìm thấy sản phẩm", exception.getMessage());
            verify(productsRepository).findById(zeroId);
            verify(productsRepository, never()).save(any(Product.class));
        }
    }

    @Nested
    @DisplayName("isProductCodeExists Tests")
    class IsProductCodeExistsTests {

        @Test
        @DisplayName("Kiểm tra mã sản phẩm tồn tại - không exclude ID")
        void isProductCodeExists_ReturnsTrue_WithExistingCode() {
            // Arrange
            String existingCode = "P001";
            when(productsRepository.existsByProductCode(existingCode)).thenReturn(true);

            // Act
            boolean result = productsService.isProductCodeExists(existingCode, null);

            // Assert
            assertTrue(result);
            verify(productsRepository).existsByProductCode(existingCode);
            verify(productsRepository, never()).existsByProductCodeAndProductIdNot(anyString(), anyLong());
        }

        @Test
        @DisplayName("Kiểm tra mã sản phẩm không tồn tại - không exclude ID")
        void isProductCodeExists_ReturnsFalse_WithNonExistingCode() {
            // Arrange
            String nonExistingCode = "NONEXIST";
            when(productsRepository.existsByProductCode(nonExistingCode)).thenReturn(false);

            // Act
            boolean result = productsService.isProductCodeExists(nonExistingCode, null);

            // Assert
            assertFalse(result);
            verify(productsRepository).existsByProductCode(nonExistingCode);
            verify(productsRepository, never()).existsByProductCodeAndProductIdNot(anyString(), anyLong());
        }

        @Test
        @DisplayName("Kiểm tra mã sản phẩm tồn tại - có exclude ID và tồn tại mã này cho sản phẩm khác")
        void isProductCodeExists_ReturnsTrue_WithExistingCodeAndExcludeId() {
            // Arrange
            String existingCode = "P001";
            Long excludeId = 2L;
            when(productsRepository.existsByProductCodeAndProductIdNot(existingCode, excludeId)).thenReturn(true);

            // Act
            boolean result = productsService.isProductCodeExists(existingCode, excludeId);

            // Assert
            assertTrue(result);
            verify(productsRepository, never()).existsByProductCode(anyString());
            verify(productsRepository).existsByProductCodeAndProductIdNot(existingCode, excludeId);
        }

        @Test
        @DisplayName("Kiểm tra mã sản phẩm tồn tại - có exclude ID và không tồn tại mã này cho sản phẩm khác")
        void isProductCodeExists_ReturnsFalse_WithNonExistingCodeAndExcludeId() {
            // Arrange
            String existingCode = "P001";
            Long excludeId = 1L;
            when(productsRepository.existsByProductCodeAndProductIdNot(existingCode, excludeId)).thenReturn(false);

            // Act
            boolean result = productsService.isProductCodeExists(existingCode, excludeId);

            // Assert
            assertFalse(result);
            verify(productsRepository, never()).existsByProductCode(anyString());
            verify(productsRepository).existsByProductCodeAndProductIdNot(existingCode, excludeId);
        }

        @Test
        @DisplayName("Kiểm tra mã sản phẩm null")
        void isProductCodeExists_WithNullProductCode() {
            // Arrange
            String nullCode = null;

            // Act & Assert
            assertThrows(
                    NullPointerException.class,
                    () -> productsService.isProductCodeExists(nullCode, null)
            );
            verify(productsRepository, never()).existsByProductCode(anyString());
            verify(productsRepository, never()).existsByProductCodeAndProductIdNot(anyString(), anyLong());
        }

        @Test
        @DisplayName("Kiểm tra mã sản phẩm rỗng")
        void isProductCodeExists_WithEmptyProductCode() {
            // Arrange
            String emptyCode = "";
            when(productsRepository.existsByProductCode(emptyCode)).thenReturn(false);

            // Act
            boolean result = productsService.isProductCodeExists(emptyCode, null);

            // Assert
            assertFalse(result);
            verify(productsRepository).existsByProductCode(emptyCode);
            verify(productsRepository, never()).existsByProductCodeAndProductIdNot(anyString(), anyLong());
        }

        @Test
        @DisplayName("Kiểm tra mã với khoảng trắng")
        void isProductCodeExists_WithWhitespaceCode() {
            // Arrange
            String whitespaceCode = "  P001  ";
            when(productsRepository.existsByProductCode(whitespaceCode)).thenReturn(false);

            // Act
            boolean result = productsService.isProductCodeExists(whitespaceCode, null);

            // Assert
            assertFalse(result);
            verify(productsRepository).existsByProductCode(whitespaceCode);
            verify(productsRepository, never()).existsByProductCodeAndProductIdNot(anyString(), anyLong());
        }

        @Test
        @DisplayName("Kiểm tra mã với excludeId = 0")
        void isProductCodeExists_WithZeroExcludeId() {
            // Arrange
            String existingCode = "P001";
            Long zeroExcludeId = 0L;
            when(productsRepository.existsByProductCodeAndProductIdNot(existingCode, zeroExcludeId)).thenReturn(true);

            // Act
            boolean result = productsService.isProductCodeExists(existingCode, zeroExcludeId);

            // Assert
            assertTrue(result);
            verify(productsRepository, never()).existsByProductCode(anyString());
            verify(productsRepository).existsByProductCodeAndProductIdNot(existingCode, zeroExcludeId);
        }

        @Test
        @DisplayName("Kiểm tra mã với excludeId âm")
        void isProductCodeExists_WithNegativeExcludeId() {
            // Arrange
            String existingCode = "P001";
            Long negativeExcludeId = -1L;
            when(productsRepository.existsByProductCodeAndProductIdNot(existingCode, negativeExcludeId)).thenReturn(true);

            // Act
            boolean result = productsService.isProductCodeExists(existingCode, negativeExcludeId);

            // Assert
            assertTrue(result);
            verify(productsRepository, never()).existsByProductCode(anyString());
            verify(productsRepository).existsByProductCodeAndProductIdNot(existingCode, negativeExcludeId);
        }

        @Test
        @DisplayName("Kiểm tra mã sản phẩm case-insensitive")
        void isProductCodeExists_CaseInsensitive() {
            // Arrange
            String upperCaseCode = "P001";
            String lowerCaseCode = "p001";

            // Giả định hệ thống phân biệt chữ hoa chữ thường
            when(productsRepository.existsByProductCode(upperCaseCode)).thenReturn(true);
            when(productsRepository.existsByProductCode(lowerCaseCode)).thenReturn(false);

            // Act
            boolean resultUpper = productsService.isProductCodeExists(upperCaseCode, null);
            boolean resultLower = productsService.isProductCodeExists(lowerCaseCode, null);

            // Assert
            assertTrue(resultUpper);
            assertFalse(resultLower);
            verify(productsRepository).existsByProductCode(upperCaseCode);
            verify(productsRepository).existsByProductCode(lowerCaseCode);
        }
    }
}