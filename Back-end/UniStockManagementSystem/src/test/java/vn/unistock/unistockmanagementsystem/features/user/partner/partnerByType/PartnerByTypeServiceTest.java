package vn.unistock.unistockmanagementsystem.features.user.partner.partnerByType;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.unistock.unistockmanagementsystem.entities.Partner;
import vn.unistock.unistockmanagementsystem.entities.PartnerByType;
import vn.unistock.unistockmanagementsystem.entities.PartnerByTypeKey;
import vn.unistock.unistockmanagementsystem.entities.PartnerType;
import vn.unistock.unistockmanagementsystem.features.user.partnerType.PartnerTypeService;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PartnerByTypeServiceTest {

    @Mock
    private PartnerByTypeRepository partnerByTypeRepository;

    @Mock
    private PartnerTypeService partnerTypeService;

    @InjectMocks
    private PartnerByTypeService partnerByTypeService;

    private Partner partner;
    private PartnerType partnerType;
    private PartnerByType partnerByType;

    @BeforeEach
    void setUp() {
        // Set up test data
        partner = Partner.builder()
                .partnerId(1L)
                .partnerName("Test Partner")
                .build();

        partnerType = PartnerType.builder()
                .typeId(1L)
                .typeName("Supplier")
                .typeCode("SUP")
                .build();

        PartnerByTypeKey key = new PartnerByTypeKey(partner.getPartnerId(), partnerType.getTypeId());
        partnerByType = new PartnerByType();
        partnerByType.setId(key);
        partnerByType.setPartner(partner);
        partnerByType.setPartnerType(partnerType);
        partnerByType.setPartnerCode("SUP01");
    }

    @Test
    @DisplayName("Should create partner by code successfully")
    void createPartnerByCode_Success() {
        // Arrange
        String partnerCode = "SUP01";

        when(partnerTypeService.getPartnerTypeByCode("SUP")).thenReturn(partnerType);
        when(partnerByTypeRepository.save(any(PartnerByType.class))).thenReturn(partnerByType);

        // Act
        PartnerByType result = partnerByTypeService.createPartnerByCode(partner, partnerCode);

        // Assert
        assertNotNull(result);
        assertEquals(partnerCode, result.getPartnerCode());
        assertEquals(partner, result.getPartner());
        assertEquals(partnerType, result.getPartnerType());

        verify(partnerTypeService).getPartnerTypeByCode("SUP");
        verify(partnerByTypeRepository).save(any(PartnerByType.class));
    }

    @Test
    @DisplayName("Should throw exception when partner type code is not found")
    void createPartnerByCode_TypeNotFound() {
        // Arrange
        String partnerCode = "XYZ01";

        when(partnerTypeService.getPartnerTypeByCode("XYZ")).thenReturn(null);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> partnerByTypeService.createPartnerByCode(partner, partnerCode)
        );

        assertTrue(exception.getMessage().contains("Không tìm thấy nhóm đối tác với mã: XYZ"));
        verify(partnerTypeService).getPartnerTypeByCode("XYZ");
        verify(partnerByTypeRepository, never()).save(any(PartnerByType.class));
    }

    @Test
    @DisplayName("Should generate partner code successfully")
    void generatePartnerCode_Success() {
        // Arrange
        Long typeId = 1L;

        when(partnerTypeService.getPartnerTypeById(typeId)).thenReturn(partnerType);
        when(partnerByTypeRepository.countByPartnerType(partnerType)).thenReturn(5);

        // Act
        String result = partnerByTypeService.generatePartnerCode(typeId);

        // Assert
        assertEquals("SUP06", result);
        verify(partnerTypeService).getPartnerTypeById(typeId);
        verify(partnerByTypeRepository).countByPartnerType(partnerType);
    }

    @Test
    @DisplayName("Should throw exception when partner type id is not found")
    void generatePartnerCode_TypeNotFound() {
        // Arrange
        Long typeId = 999L;

        when(partnerTypeService.getPartnerTypeById(typeId)).thenReturn(null);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> partnerByTypeService.generatePartnerCode(typeId)
        );

        assertEquals("Nhóm đối tác không tồn tại!", exception.getMessage());
        verify(partnerTypeService).getPartnerTypeById(typeId);
        verify(partnerByTypeRepository, never()).countByPartnerType(any(PartnerType.class));
    }
}