package vn.unistock.unistockmanagementsystem.features.user.partnerType;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.unistock.unistockmanagementsystem.entities.PartnerType;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PartnerTypeServiceTest {

    @Mock
    private PartnerTypeRepository partnerTypeRepository;

    @Mock
    private PartnerTypeMapper partnerTypeMapper;

    @InjectMocks
    private PartnerTypeService partnerTypeService;

    private PartnerType samplePartnerType;
    private PartnerTypeDTO samplePartnerTypeDTO;

    @BeforeEach
    void setUp() {
        // Setup sample data for tests
        samplePartnerType = new PartnerType();
        samplePartnerType.setTypeId(1L);
        samplePartnerType.setTypeCode("TEST");
        samplePartnerType.setTypeName("Test Partner");
        samplePartnerType.setStatus(true);
        samplePartnerType.setDescription("Test Description");

        samplePartnerTypeDTO = PartnerTypeDTO.builder()
                .typeId(1L)
                .typeCode("TEST")
                .typeName("Test Partner")
                .status(true)
                .description("Test Description")
                .build();
    }

    @Test
    @DisplayName("Should return all partner types")
    void getAllPartnerTypes_ShouldReturnAllPartnerTypes() {
        // Arrange
        List<PartnerType> partnerTypes = Arrays.asList(samplePartnerType);
        when(partnerTypeRepository.findAll()).thenReturn(partnerTypes);
        when(partnerTypeMapper.toDTO(any(PartnerType.class))).thenReturn(samplePartnerTypeDTO);

        // Act
        List<PartnerTypeDTO> result = partnerTypeService.getAllPartnerTypes();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(samplePartnerTypeDTO, result.get(0));
        verify(partnerTypeRepository).findAll();
        verify(partnerTypeMapper).toDTO(any(PartnerType.class));
    }

    @Test
    @DisplayName("Should add partner type successfully")
    void addPartnerType_ShouldAddPartnerTypeSuccessfully() {
        // Arrange
        when(partnerTypeRepository.existsByTypeCode(anyString())).thenReturn(false);
        when(partnerTypeRepository.existsByTypeName(anyString())).thenReturn(false);
        when(partnerTypeMapper.toEntity(any(PartnerTypeDTO.class))).thenReturn(samplePartnerType);
        when(partnerTypeRepository.save(any(PartnerType.class))).thenReturn(samplePartnerType);
        when(partnerTypeMapper.toDTO(any(PartnerType.class))).thenReturn(samplePartnerTypeDTO);

        // Act
        PartnerTypeDTO result = partnerTypeService.addPartnerType(samplePartnerTypeDTO);

        // Assert
        assertNotNull(result);
        assertEquals(samplePartnerTypeDTO, result);
        verify(partnerTypeRepository).existsByTypeCode(anyString());
        verify(partnerTypeRepository).existsByTypeName(anyString());
        verify(partnerTypeMapper).toEntity(any(PartnerTypeDTO.class));
        verify(partnerTypeRepository).save(any(PartnerType.class));
        verify(partnerTypeMapper).toDTO(any(PartnerType.class));
    }

    @Test
    @DisplayName("Should throw exception when code already exists")
    void addPartnerType_ShouldThrowExceptionWhenCodeExists() {
        // Arrange
        when(partnerTypeRepository.existsByTypeCode(anyString())).thenReturn(true);
        when(partnerTypeRepository.existsByTypeName(anyString())).thenReturn(false);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            partnerTypeService.addPartnerType(samplePartnerTypeDTO);
        });
        assertEquals("DUPLICATE_CODE", exception.getMessage());
    }

    @Test
    @DisplayName("Should throw exception when name already exists")
    void addPartnerType_ShouldThrowExceptionWhenNameExists() {
        // Arrange
        when(partnerTypeRepository.existsByTypeCode(anyString())).thenReturn(false);
        when(partnerTypeRepository.existsByTypeName(anyString())).thenReturn(true);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            partnerTypeService.addPartnerType(samplePartnerTypeDTO);
        });
        assertEquals("DUPLICATE_NAME", exception.getMessage());
    }

    @Test
    @DisplayName("Should throw exception when both code and name already exist")
    void addPartnerType_ShouldThrowExceptionWhenCodeAndNameExist() {
        // Arrange
        when(partnerTypeRepository.existsByTypeCode(anyString())).thenReturn(true);
        when(partnerTypeRepository.existsByTypeName(anyString())).thenReturn(true);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            partnerTypeService.addPartnerType(samplePartnerTypeDTO);
        });
        assertEquals("DUPLICATE_CODE_AND_NAME", exception.getMessage());
    }

    @Test
    @DisplayName("Should update partner type successfully")
    void updatePartnerType_ShouldUpdatePartnerTypeSuccessfully() {
        // Arrange
        when(partnerTypeRepository.findById(anyLong())).thenReturn(Optional.of(samplePartnerType));
        when(partnerTypeRepository.save(any(PartnerType.class))).thenReturn(samplePartnerType);
        when(partnerTypeMapper.toDTO(any(PartnerType.class))).thenReturn(samplePartnerTypeDTO);

        // New data with same code and name - no validation needed
        PartnerTypeDTO updatedDTO = PartnerTypeDTO.builder()
                .typeId(1L)
                .typeCode("TEST")
                .typeName("Test Partner")
                .status(false)
                .description("Updated Description")
                .build();

        // Act
        PartnerTypeDTO result = partnerTypeService.updatePartnerType(1L, updatedDTO);

        // Assert
        assertNotNull(result);
        assertEquals(samplePartnerTypeDTO, result);
        verify(partnerTypeRepository).findById(1L);
        verify(partnerTypeRepository).save(any(PartnerType.class));
        verify(partnerTypeMapper).toDTO(any(PartnerType.class));
    }

    @Test
    @DisplayName("Should update partner type with new code and validate")
    void updatePartnerType_WithNewCodeShouldValidate() {
        // Arrange
        when(partnerTypeRepository.findById(anyLong())).thenReturn(Optional.of(samplePartnerType));

        // Updated DTO with new code
        PartnerTypeDTO updatedDTO = PartnerTypeDTO.builder()
                .typeId(1L)
                .typeCode("NEW_CODE")
                .typeName("Test Partner")
                .status(true)
                .description("Test Description")
                .build();

        when(partnerTypeRepository.existsByTypeCode("NEW_CODE")).thenReturn(true);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            partnerTypeService.updatePartnerType(1L, updatedDTO);
        });
        assertEquals("DUPLICATE_CODE", exception.getMessage());
    }

    @Test
    @DisplayName("Should update partner type with new name and validate")
    void updatePartnerType_WithNewNameShouldValidate() {
        // Arrange
        when(partnerTypeRepository.findById(anyLong())).thenReturn(Optional.of(samplePartnerType));

        // Updated DTO with new name
        PartnerTypeDTO updatedDTO = PartnerTypeDTO.builder()
                .typeId(1L)
                .typeCode("TEST")
                .typeName("New Partner Name")
                .status(true)
                .description("Test Description")
                .build();

        when(partnerTypeRepository.existsByTypeName("New Partner Name")).thenReturn(true);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            partnerTypeService.updatePartnerType(1L, updatedDTO);
        });
        assertEquals("DUPLICATE_NAME", exception.getMessage());
    }

    @Test
    @DisplayName("Should throw exception when both new code and name exist")
    void updatePartnerType_WithNewCodeAndNameShouldValidateBoth() {
        // Arrange
        when(partnerTypeRepository.findById(anyLong())).thenReturn(Optional.of(samplePartnerType));

        // Updated DTO with new code and name
        PartnerTypeDTO updatedDTO = PartnerTypeDTO.builder()
                .typeId(1L)
                .typeCode("NEW_CODE")
                .typeName("New Partner Name")
                .status(true)
                .description("Test Description")
                .build();

        when(partnerTypeRepository.existsByTypeCode("NEW_CODE")).thenReturn(true);
        when(partnerTypeRepository.existsByTypeName("New Partner Name")).thenReturn(true);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            partnerTypeService.updatePartnerType(1L, updatedDTO);
        });
        assertEquals("DUPLICATE_CODE_AND_NAME", exception.getMessage());
    }

    @Test
    @DisplayName("Should throw exception when partner type not found for update")
    void updatePartnerType_ShouldThrowExceptionWhenNotFound() {
        // Arrange
        when(partnerTypeRepository.findById(anyLong())).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            partnerTypeService.updatePartnerType(1L, samplePartnerTypeDTO);
        });
        assertEquals("Loại đối tác không tồn tại", exception.getMessage());
    }

    @Test
    @DisplayName("Should update partner type status successfully")
    void updatePartnerTypeStatus_ShouldUpdateStatusSuccessfully() {
        // Arrange
        when(partnerTypeRepository.findById(anyLong())).thenReturn(Optional.of(samplePartnerType));
        when(partnerTypeRepository.save(any(PartnerType.class))).thenReturn(samplePartnerType);
        when(partnerTypeMapper.toDTO(any(PartnerType.class))).thenReturn(samplePartnerTypeDTO);

        // Act
        PartnerTypeDTO result = partnerTypeService.updatePartnerTypeStatus(1L, false);

        // Assert
        assertNotNull(result);
        assertEquals(samplePartnerTypeDTO, result);
        verify(partnerTypeRepository).findById(1L);
        verify(partnerTypeRepository).save(any(PartnerType.class));
        verify(partnerTypeMapper).toDTO(any(PartnerType.class));
    }

    @Test
    @DisplayName("Should throw exception when partner type not found for status update")
    void updatePartnerTypeStatus_ShouldThrowExceptionWhenNotFound() {
        // Arrange
        when(partnerTypeRepository.findById(anyLong())).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            partnerTypeService.updatePartnerTypeStatus(1L, false);
        });
        assertEquals("Loại đối tác không tồn tại", exception.getMessage());
    }

    @Test
    @DisplayName("Should get partner type by code successfully")
    void getPartnerTypeByCode_ShouldReturnPartnerType() {
        // Arrange
        when(partnerTypeRepository.findByTypeCode(anyString())).thenReturn(Optional.of(samplePartnerType));

        // Act
        PartnerType result = partnerTypeService.getPartnerTypeByCode("TEST");

        // Assert
        assertNotNull(result);
        assertEquals(samplePartnerType, result);
        verify(partnerTypeRepository).findByTypeCode("TEST");
    }

    @Test
    @DisplayName("Should throw exception when partner type not found by code")
    void getPartnerTypeByCode_ShouldThrowExceptionWhenNotFound() {
        // Arrange
        when(partnerTypeRepository.findByTypeCode(anyString())).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            partnerTypeService.getPartnerTypeByCode("NOT_FOUND");
        });
        assertEquals("Loại đối tác không tồn tại", exception.getMessage());
    }

    @Test
    @DisplayName("Should get partner type by id successfully")
    void getPartnerTypeById_ShouldReturnPartnerType() {
        // Arrange
        when(partnerTypeRepository.findById(anyLong())).thenReturn(Optional.of(samplePartnerType));

        // Act
        PartnerType result = partnerTypeService.getPartnerTypeById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(samplePartnerType, result);
        verify(partnerTypeRepository).findById(1L);
    }

    @Test
    @DisplayName("Should throw exception when partner type not found by id")
    void getPartnerTypeById_ShouldThrowExceptionWhenNotFound() {
        // Arrange
        when(partnerTypeRepository.findById(anyLong())).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            partnerTypeService.getPartnerTypeById(999L);
        });
        assertEquals("Loại đối tác không tồn tại", exception.getMessage());
    }
}