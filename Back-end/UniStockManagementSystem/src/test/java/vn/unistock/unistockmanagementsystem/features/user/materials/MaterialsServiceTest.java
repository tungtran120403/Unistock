//package vn.unistock.unistockmanagementsystem.features.user.materials;
//
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.InjectMocks;
//import org.mockito.Mock;
//import org.mockito.junit.jupiter.MockitoExtension;
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.PageImpl;
//import org.springframework.data.domain.PageRequest;
//import org.springframework.data.domain.Pageable;
//import org.springframework.web.multipart.MultipartFile;
//import vn.unistock.unistockmanagementsystem.entities.Material;
//import vn.unistock.unistockmanagementsystem.entities.MaterialType;
//import vn.unistock.unistockmanagementsystem.entities.Unit;
//import vn.unistock.unistockmanagementsystem.features.user.materialType.MaterialTypeRepository;
//import vn.unistock.unistockmanagementsystem.features.user.units.UnitRepository;
//import vn.unistock.unistockmanagementsystem.utils.storage.AzureBlobService;
//
//import java.io.IOException;
//import java.time.LocalDateTime;
//import java.util.Arrays;
//import java.util.List;
//import java.util.Optional;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.ArgumentMatchers.*;
//import static org.mockito.Mockito.*;
//
//@ExtendWith(MockitoExtension.class)
//class MaterialsServiceTest {
//
//    @Mock
//    private MaterialsRepository materialsRepository;
//
//    @Mock
//    private UnitRepository unitRepository;
//
//    @Mock
//    private MaterialTypeRepository materialTypeRepository;
//
//    @Mock
//    private AzureBlobService azureBlobService;
//
//    @InjectMocks
//    private MaterialsService materialsService;
//
//    private Material material1;
//    private Material material2;
//    private Unit unit;
//    private MaterialType materialType;
//    private MaterialsDTO materialsDTO;
//
//    @BeforeEach
//    void setUp() {
//        // Set up Unit
//        unit = new Unit();
//        unit.setUnitId(1L);
//        unit.setUnitName("Kilogram");
//
//        // Set up MaterialType
//        materialType = new MaterialType();
//        materialType.setMaterialTypeId(1L);
//        materialType.setName("Raw Material");
//
//        // Set up Material 1
//        material1 = new Material();
//        material1.setMaterialId(1L);
//        material1.setMaterialCode("MAT001");
//        material1.setMaterialName("Test Material 1");
//        material1.setDescription("Test Description 1");
//        material1.setUnit(unit);
//        material1.setMaterialType(materialType);
//        material1.setIsUsing(true);
//        material1.setImageUrl("http://test-image-url-1.jpg");
//        material1.setCreatedBy("admin");
//        material1.setCreatedAt(LocalDateTime.now());
//
//        // Set up Material 2
//        material2 = new Material();
//        material2.setMaterialId(2L);
//        material2.setMaterialCode("MAT002");
//        material2.setMaterialName("Test Material 2");
//        material2.setDescription("Test Description 2");
//        material2.setUnit(unit);
//        material2.setMaterialType(materialType);
//        material2.setIsUsing(false);
//        material2.setImageUrl("http://test-image-url-2.jpg");
//        material2.setCreatedBy("admin");
//        material2.setCreatedAt(LocalDateTime.now());
//
//        // Set up MaterialsDTO
//        materialsDTO = new MaterialsDTO();
//        materialsDTO.setMaterialCode("MAT003");
//        materialsDTO.setMaterialName("New Material");
//        materialsDTO.setDescription("New Description");
//        materialsDTO.setUnitId(1L);
//        materialsDTO.setTypeId(1L);
//        materialsDTO.setIsUsing(true);
//        materialsDTO.setImageUrl("http://test-image-url-3.jpg");
//    }
//
//    @Test
//    void getAllMaterials_ReturnsPageOfMaterialsDTO() {
//        // Arrange
//        List<Material> materials = Arrays.asList(material1, material2);
//        Page<Material> materialPage = new PageImpl<>(materials);
//        Pageable pageable = PageRequest.of(0, 10);
//
//        when(materialsRepository.findAll(pageable)).thenReturn(materialPage);
//
//        // Act
//        Page<MaterialsDTO> result = materialsService.getAllMaterials(0, 10);
//
//        // Assert
//        assertNotNull(result);
//        assertEquals(2, result.getTotalElements());
//        assertEquals("MAT001", result.getContent().get(0).getMaterialCode());
//        assertEquals("MAT002", result.getContent().get(1).getMaterialCode());
//
//        verify(materialsRepository).findAll(pageable);
//    }
//
//    @Test
//    void createMaterial_ReturnsCreatedMaterial() {
//        // Arrange
//        when(unitRepository.findById(1L)).thenReturn(Optional.of(unit));
//        when(materialTypeRepository.findById(1L)).thenReturn(Optional.of(materialType));
//        when(materialsRepository.save(any(Material.class))).thenAnswer(invocation -> {
//            Material savedMaterial = invocation.getArgument(0);
//            savedMaterial.setMaterialId(3L);
//            return savedMaterial;
//        });
//
//        // Act
//        Material result = materialsService.createMaterial(materialsDTO, "testUser");
//
//        // Assert
//        assertNotNull(result);
//        assertEquals(3L, result.getMaterialId());
//        assertEquals("MAT003", result.getMaterialCode());
//        assertEquals("New Material", result.getMaterialName());
//        assertEquals("New Description", result.getDescription());
//        assertEquals(unit, result.getUnit());
//        assertEquals(materialType, result.getMaterialType());
//        assertTrue(result.getIsUsing());
//        assertEquals("http://test-image-url-3.jpg", result.getImageUrl());
//        assertEquals("testUser", result.getCreatedBy());
//        assertNotNull(result.getCreatedAt());
//
//        verify(unitRepository).findById(1L);
//        verify(materialTypeRepository).findById(1L);
//        verify(materialsRepository).save(any(Material.class));
//    }
//
//    @Test
//    void createMaterial_WithNullIsUsing_SetsDefaultToTrue() {
//        // Arrange
//        materialsDTO.setIsUsing(null);
//
//        when(unitRepository.findById(1L)).thenReturn(Optional.of(unit));
//        when(materialTypeRepository.findById(1L)).thenReturn(Optional.of(materialType));
//        when(materialsRepository.save(any(Material.class))).thenAnswer(invocation -> {
//            Material savedMaterial = invocation.getArgument(0);
//            savedMaterial.setMaterialId(3L);
//            return savedMaterial;
//        });
//
//        // Act
//        Material result = materialsService.createMaterial(materialsDTO, "testUser");
//
//        // Assert
//        assertNotNull(result);
//        assertTrue(result.getIsUsing());
//
//        verify(materialsRepository).save(any(Material.class));
//    }
//
//    @Test
//    void createMaterial_WithUnitNotFound_ThrowsRuntimeException() {
//        // Arrange
//        when(unitRepository.findById(1L)).thenReturn(Optional.empty());
//
//        // Act & Assert
//        RuntimeException exception = assertThrows(RuntimeException.class, () ->
//                materialsService.createMaterial(materialsDTO, "testUser")
//        );
//
//        assertEquals("Không tìm thấy đơn vị với ID: 1", exception.getMessage());
//        verify(unitRepository).findById(1L);
//        verify(materialsRepository, never()).save(any(Material.class));
//    }
//
//    @Test
//    void createMaterial_WithMaterialTypeNotFound_ThrowsRuntimeException() {
//        // Arrange
//        when(unitRepository.findById(1L)).thenReturn(Optional.of(unit));
//        when(materialTypeRepository.findById(1L)).thenReturn(Optional.empty());
//
//        // Act & Assert
//        RuntimeException exception = assertThrows(RuntimeException.class, () ->
//                materialsService.createMaterial(materialsDTO, "testUser")
//        );
//
//        assertEquals("Không tìm thấy danh mục với ID: 1", exception.getMessage());
//        verify(unitRepository).findById(1L);
//        verify(materialTypeRepository).findById(1L);
//        verify(materialsRepository, never()).save(any(Material.class));
//    }
//
//    @Test
//    void getMaterialById_WithExistingId_ReturnsMaterialDTO() {
//        // Arrange
//        when(materialsRepository.findById(1L)).thenReturn(Optional.of(material1));
//
//        // Act
//        MaterialsDTO result = materialsService.getMaterialById(1L);
//
//        // Assert
//        assertNotNull(result);
//        assertEquals(1L, result.getMaterialId());
//        assertEquals("MAT001", result.getMaterialCode());
//        assertEquals("Test Material 1", result.getMaterialName());
//
//        verify(materialsRepository).findById(1L);
//    }
//
//    @Test
//    void getMaterialById_WithNonExistingId_ThrowsIllegalArgumentException() {
//        // Arrange
//        when(materialsRepository.findById(99L)).thenReturn(Optional.empty());
//
//        // Act & Assert
//        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
//                materialsService.getMaterialById(99L)
//        );
//
//        assertEquals("Không tìm thấy nguyên vật liệu với ID: 99", exception.getMessage());
//        verify(materialsRepository).findById(99L);
//    }
//
//    @Test
//    void toggleUsingStatus_WithExistingIdAndTrue_ChangeToFalse() {
//        // Arrange
//        when(materialsRepository.findById(1L)).thenReturn(Optional.of(material1)); // material1 has isUsing=true
//        when(materialsRepository.save(any(Material.class))).thenReturn(material1);
//
//        // Act
//        MaterialsDTO result = materialsService.toggleUsingStatus(1L);
//
//        // Assert
//        assertNotNull(result);
//        assertFalse(material1.getIsUsing()); // Should toggle from true to false
//
//        verify(materialsRepository).findById(1L);
//        verify(materialsRepository).save(material1);
//    }
//
//    @Test
//    void toggleUsingStatus_WithExistingIdAndFalse_ChangeToTrue() {
//        // Arrange
//        when(materialsRepository.findById(2L)).thenReturn(Optional.of(material2)); // material2 has isUsing=false
//        when(materialsRepository.save(any(Material.class))).thenReturn(material2);
//
//        // Act
//        MaterialsDTO result = materialsService.toggleUsingStatus(2L);
//
//        // Assert
//        assertNotNull(result);
//        assertTrue(material2.getIsUsing()); // Should toggle from false to true
//
//        verify(materialsRepository).findById(2L);
//        verify(materialsRepository).save(material2);
//    }
//
//    @Test
//    void toggleUsingStatus_WithNonExistingId_ThrowsRuntimeException() {
//        // Arrange
//        when(materialsRepository.findById(99L)).thenReturn(Optional.empty());
//
//        // Act & Assert
//        RuntimeException exception = assertThrows(RuntimeException.class, () ->
//                materialsService.toggleUsingStatus(99L)
//        );
//
//        assertEquals("Không tìm thấy nguyên vật liệu", exception.getMessage());
//        verify(materialsRepository).findById(99L);
//        verify(materialsRepository, never()).save(any(Material.class));
//    }
//
//    @Test
//    void isMaterialCodeExists_WithExistingCodeAndNoExcludeId_ReturnsTrue() {
//        // Arrange
//        when(materialsRepository.existsByMaterialCode("MAT001")).thenReturn(true);
//
//        // Act
//        boolean result = materialsService.isMaterialCodeExists("MAT001", null);
//
//        // Assert
//        assertTrue(result);
//        verify(materialsRepository).existsByMaterialCode("MAT001");
//        verify(materialsRepository, never()).existsByMaterialCodeAndMaterialIdNot(anyString(), anyLong());
//    }
//
//    @Test
//    void isMaterialCodeExists_WithNonExistingCodeAndNoExcludeId_ReturnsFalse() {
//        // Arrange
//        when(materialsRepository.existsByMaterialCode("NON_EXISTING")).thenReturn(false);
//
//        // Act
//        boolean result = materialsService.isMaterialCodeExists("NON_EXISTING", null);
//
//        // Assert
//        assertFalse(result);
//        verify(materialsRepository).existsByMaterialCode("NON_EXISTING");
//    }
//
//    @Test
//    void isMaterialCodeExists_WithExistingCodeAndExcludeId_ReturnsTrueIfAnotherMaterialHasSameCode() {
//        // Arrange
//        when(materialsRepository.existsByMaterialCodeAndMaterialIdNot("MAT001", 2L)).thenReturn(true);
//
//        // Act
//        boolean result = materialsService.isMaterialCodeExists("MAT001", 2L);
//
//        // Assert
//        assertTrue(result);
//        verify(materialsRepository).existsByMaterialCodeAndMaterialIdNot("MAT001", 2L);
//        verify(materialsRepository, never()).existsByMaterialCode(anyString());
//    }
//
//    @Test
//    void updateMaterial_WithValidIdAndNoNewImage_UpdatesAndReturnsMaterialDTO() throws IOException {
//        // Arrange
//        MaterialsDTO updateDTO = new MaterialsDTO();
//        updateDTO.setMaterialCode("MAT001-UPDATED");
//        updateDTO.setMaterialName("Updated Material");
//        updateDTO.setDescription("Updated Description");
//        updateDTO.setUnitId(1L);
//        updateDTO.setTypeId(1L);
//        updateDTO.setIsUsing(true);
//
//        when(materialsRepository.findById(1L)).thenReturn(Optional.of(material1));
//        when(unitRepository.findById(1L)).thenReturn(Optional.of(unit));
//        when(materialTypeRepository.findById(1L)).thenReturn(Optional.of(materialType));
//        when(materialsRepository.save(any(Material.class))).thenReturn(material1);
//
//        // Act
//        MaterialsDTO result = materialsService.updateMaterial(1L, updateDTO, null);
//
//        // Assert
//        assertNotNull(result);
//        assertEquals("MAT001-UPDATED", material1.getMaterialCode());
//        assertEquals("Updated Material", material1.getMaterialName());
//        assertEquals("Updated Description", material1.getDescription());
//        assertEquals(unit, material1.getUnit());
//        assertEquals(materialType, material1.getMaterialType());
//        assertTrue(material1.getIsUsing());
//
//        verify(materialsRepository).findById(1L);
//        verify(unitRepository).findById(1L);
//        verify(materialTypeRepository).findById(1L);
//        verify(materialsRepository).save(material1);
//        verifyNoInteractions(azureBlobService);
//    }
//
//    @Test
//    void updateMaterial_WithValidIdAndNewImage_UpdatesImageAndData() throws IOException {
//        // Arrange
//        MaterialsDTO updateDTO = new MaterialsDTO();
//        updateDTO.setMaterialCode("MAT001-UPDATED");
//        updateDTO.setMaterialName("Updated Material");
//        updateDTO.setDescription("Updated Description");
//        updateDTO.setUnitId(1L);
//        updateDTO.setTypeId(1L);
//        updateDTO.setIsUsing(true);
//
//        MultipartFile newImage = mock(MultipartFile.class);
//        when(newImage.isEmpty()).thenReturn(false);
//
//        when(materialsRepository.findById(1L)).thenReturn(Optional.of(material1));
//        when(unitRepository.findById(1L)).thenReturn(Optional.of(unit));
//        when(materialTypeRepository.findById(1L)).thenReturn(Optional.of(materialType));
//        when(azureBlobService.uploadFile(newImage)).thenReturn("http://new-image-url.jpg");
//        when(materialsRepository.save(any(Material.class))).thenReturn(material1);
//
//        // Act
//        MaterialsDTO result = materialsService.updateMaterial(1L, updateDTO, newImage);
//
//        // Assert
//        assertNotNull(result);
//        assertEquals("MAT001-UPDATED", material1.getMaterialCode());
//        assertEquals("http://new-image-url.jpg", material1.getImageUrl());
//
//        verify(materialsRepository).findById(1L);
//        verify(azureBlobService).deleteFile("http://test-image-url-1.jpg");
//        verify(azureBlobService).uploadFile(newImage);
//        verify(materialsRepository).save(material1);
//    }
//
//    @Test
//    void updateMaterial_WithNonExistingId_ThrowsRuntimeException() throws IOException {
//        // Arrange
//        MaterialsDTO updateDTO = new MaterialsDTO();
//        when(materialsRepository.findById(99L)).thenReturn(Optional.empty());
//
//        // Act & Assert
//        RuntimeException exception = assertThrows(RuntimeException.class, () ->
//                materialsService.updateMaterial(99L, updateDTO, null)
//        );
//
//        assertEquals("Không tìm thấy nguyên vật liệu", exception.getMessage());
//        verify(materialsRepository).findById(99L);
//        verify(materialsRepository, never()).save(any(Material.class));
//    }
//}