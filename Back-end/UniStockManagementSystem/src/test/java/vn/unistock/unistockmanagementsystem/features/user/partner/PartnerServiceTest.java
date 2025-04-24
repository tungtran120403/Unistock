package vn.unistock.unistockmanagementsystem.features.user.partner;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import vn.unistock.unistockmanagementsystem.entities.Partner;
import vn.unistock.unistockmanagementsystem.entities.PartnerByType;
import vn.unistock.unistockmanagementsystem.features.user.partner.partnerByType.PartnerByTypeService;
import vn.unistock.unistockmanagementsystem.features.user.partnerType.PartnerTypeService;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PartnerServiceTest {

    @Mock
    private PartnerRepository partnerRepository;

    @Mock
    private PartnerMapper partnerMapper;

    @Mock
    private PartnerTypeService partnerTypeService;

    @Mock
    private PartnerByTypeService partnerByTypeService;

    @InjectMocks
    private PartnerService partnerService;

    private Partner partner;
    private PartnerDTO partnerDTO;
    private Page<Partner> partnerPage;

    @BeforeEach
    void setUp() {
        // Set up test data
        partner = Partner.builder()
                .partnerId(1L)
                .partnerName("Test Partner")
                .address("123 Test Street")
                .phone("1234567890")
                .email("test@partner.com")
                .partnerTypes(new HashSet<>())
                .build();

        partnerDTO = PartnerDTO.builder()
                .partnerId(1L)
                .partnerName("Test Partner")
                .address("123 Test Street")
                .phone("1234567890")
                .email("test@partner.com")
                .partnerCodes(Arrays.asList("SUP01"))
                .build();

        List<Partner> partners = new ArrayList<>();
        partners.add(partner);
        partnerPage = new PageImpl<>(partners);
    }

    @Test
    @DisplayName("Should return a page of all partners")
    void getAllPartners() {
        // Arrange
        int page = 0;
        int size = 10;
        Pageable pageable = PageRequest.of(page, size);

        when(partnerRepository.findAll(pageable)).thenReturn(partnerPage);
        when(partnerMapper.toDTO(any(Partner.class))).thenReturn(partnerDTO);

        // Act
        Page<PartnerDTO> result = partnerService.getAllPartners(page, size);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(partnerDTO.getPartnerName(), result.getContent().get(0).getPartnerName());

        verify(partnerRepository).findAll(pageable);
        verify(partnerMapper).toDTO(partner);
    }

    @Test
    @DisplayName("Should create a new partner successfully")
    void createPartner_Success() {
        // Arrange
        PartnerByType partnerByType = mock(PartnerByType.class);

        when(partnerRepository.existsByPartnerName(partnerDTO.getPartnerName())).thenReturn(false);
        when(partnerRepository.save(any(Partner.class))).thenReturn(partner);
        when(partnerByTypeService.createPartnerByCode(any(Partner.class), anyString())).thenReturn(partnerByType);
        when(partnerMapper.toDTO(any(Partner.class))).thenReturn(partnerDTO);

        // Act
        PartnerDTO result = partnerService.createPartner(partnerDTO);

        // Assert
        assertNotNull(result);
        assertEquals(partnerDTO.getPartnerName(), result.getPartnerName());

        verify(partnerRepository).existsByPartnerName(partnerDTO.getPartnerName());
        verify(partnerRepository, times(2)).save(any(Partner.class));
        verify(partnerByTypeService).createPartnerByCode(any(Partner.class), eq("SUP01"));
        verify(partnerMapper).toDTO(partner);
    }

    @Test
    @DisplayName("Should throw exception when partner name already exists")
    void createPartner_DuplicateName() {
        // Arrange
        when(partnerRepository.existsByPartnerName(partnerDTO.getPartnerName())).thenReturn(true);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> partnerService.createPartner(partnerDTO)
        );

        assertEquals("DUPLICATE_NAME", exception.getMessage());
        verify(partnerRepository).existsByPartnerName(partnerDTO.getPartnerName());
        verify(partnerRepository, never()).save(any(Partner.class));
    }

    @Test
    @DisplayName("Should throw exception when no partner type is provided")
    void createPartner_NoPartnerType() {
        // Arrange
        partnerDTO.setPartnerCodes(null);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> partnerService.createPartner(partnerDTO)
        );

        assertEquals("NO_PARTNER_TYPE", exception.getMessage());
        verify(partnerRepository, never()).existsByPartnerName(anyString());
        verify(partnerRepository, never()).save(any(Partner.class));
    }

    @Test
    @DisplayName("Should return a page of partners by type")
    void getPartnersByType() {
        // Arrange
        Long typeId = 1L;
        int page = 0;
        int size = 10;
        Pageable pageable = PageRequest.of(page, size);

        when(partnerRepository.findByPartnerTypes_PartnerType_typeId(typeId, pageable)).thenReturn(partnerPage);
        when(partnerMapper.toDTO(any(Partner.class))).thenReturn(partnerDTO);

        // Act
        Page<PartnerDTO> result = partnerService.getPartnersByType(typeId, page, size);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(partnerDTO.getPartnerName(), result.getContent().get(0).getPartnerName());

        verify(partnerRepository).findByPartnerTypes_PartnerType_typeId(typeId, pageable);
        verify(partnerMapper).toDTO(partner);
    }
}