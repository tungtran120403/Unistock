package vn.unistock.unistockmanagementsystem.features.user.receiptnote;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.web.multipart.MultipartFile;
import vn.unistock.unistockmanagementsystem.entities.*;
import vn.unistock.unistockmanagementsystem.features.user.materials.MaterialsRepository;
import vn.unistock.unistockmanagementsystem.features.user.products.ProductsRepository;
import vn.unistock.unistockmanagementsystem.features.user.units.UnitRepository;
import vn.unistock.unistockmanagementsystem.features.user.warehouse.WarehouseRepository;
import vn.unistock.unistockmanagementsystem.utils.storage.AzureBlobService;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UnitReceiptNoteTest {
    @InjectMocks
    private ReceiptNoteService receiptNoteService;

    @Mock private ReceiptNoteRepository receiptNoteRepository;
    @Mock private PaperEvidenceRepository paperEvidenceRepository;
    @Mock private AzureBlobService azureBlobService;
    @Mock private ReceiptNoteMapper receiptNoteMapper;
    @Mock private ReceiptNoteDetailRepository detailRepository;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private UnitRepository unitRepository;
    @Mock private MaterialsRepository materialRepository;
    @Mock private ProductsRepository productRepository;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    // Test getAllReceiptNote
    @Test
    void testGetAllReceiptNote_Normal() {
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "grnId"));
        Page<GoodReceiptNote> page = new PageImpl<>(List.of(new GoodReceiptNote()));

        when(receiptNoteRepository.findByFilters(null, null, null, null, pageable)).thenReturn(page);
        when(receiptNoteMapper.toDTO(any())).thenReturn(new ReceiptNoteDTO());

        Page<ReceiptNoteDTO> result = receiptNoteService.getAllReceiptNote(0, 10, null, null, null, null);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void testGetAllReceiptNote_Empty() {
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "grnId"));
        Page<GoodReceiptNote> emptyPage = new PageImpl<>(Collections.emptyList());

        when(receiptNoteRepository.findByFilters(null, null, null, null, pageable)).thenReturn(emptyPage);

        Page<ReceiptNoteDTO> result = receiptNoteService.getAllReceiptNote(0, 10, null, null, null, null);
        assertTrue(result.isEmpty());
    }

    // Test getNextReceiptCode
    @Test
    void testGetNextReceiptCode_Normal() {
        when(receiptNoteRepository.findMaxGoodReceiptNoteId()).thenReturn(5L);
        String code = receiptNoteService.getNextReceiptCode();
        assertEquals("NK00006", code);
    }

    @Test
    void testGetNextReceiptCode_Empty() {
        when(receiptNoteRepository.findMaxGoodReceiptNoteId()).thenReturn(null);
        String code = receiptNoteService.getNextReceiptCode();
        assertEquals("NK00001", code);
    }

    @Test
    void testGetNextReceiptCode_Exception() {
        when(receiptNoteRepository.findMaxGoodReceiptNoteId()).thenThrow(new RuntimeException("DB error"));
        assertThrows(RuntimeException.class, () -> receiptNoteService.getNextReceiptCode());
    }

    // Test getAllReceiptNoteById
    @Test
    void testGetAllReceiptNoteById_NotFound() {
        when(receiptNoteRepository.findById(999L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> receiptNoteService.getAllReceiptNoteById(999L));
        assertNotNull(ex);
        assertTrue(ex.getMessage().contains("Không tìm thấy phiếu nhập"));
    }

    // Test uploadPaperEvidence
    @Test
    void testUploadPaperEvidence_Normal() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(azureBlobService.uploadFile(file)).thenReturn("http://testfile");
        when(receiptNoteRepository.findById(1L)).thenReturn(Optional.of(new GoodReceiptNote()));

        List<String> urls = receiptNoteService.uploadPaperEvidence(1L, "GOOD_RECEIPT_NOTE", List.of(file), new User());
        assertEquals(1, urls.size());
    }

    @Test
    void testUploadPaperEvidence_EmptyFile() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(true);
        when(receiptNoteRepository.findById(1L)).thenReturn(Optional.of(new GoodReceiptNote()));

        List<String> urls = receiptNoteService.uploadPaperEvidence(1L, "GOOD_RECEIPT_NOTE", List.of(file), new User());
        assertEquals(0, urls.size());
    }

    @Test
    void testUploadPaperEvidence_NotFound() {
        when(receiptNoteRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> receiptNoteService.uploadPaperEvidence(1L, "GOOD_RECEIPT_NOTE", List.of(), new User()));
    }

    // Test getImportReportPaginated
    @Test
    void testGetImportReportPaginated_Normal() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<ReceiptNoteDetailViewDTO> page = new PageImpl<>(List.of(new ReceiptNoteDetailViewDTO()));
        when(detailRepository.getFilteredImportReport(any(), any(), any(), any(), any(), any(), any(), any(), eq(pageable)))
                .thenReturn(page);

        Page<ReceiptNoteDetailViewDTO> result = receiptNoteService.getImportReportPaginated(0, 10, null, null, null, null, null, null, null, null);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void testGetImportReportPaginated_Empty() {
        Pageable pageable = PageRequest.of(0, 10);
        when(detailRepository.getFilteredImportReport(any(), any(), any(), any(), any(), any(), any(), any(), eq(pageable)))
                .thenReturn(Page.empty());

        Page<ReceiptNoteDetailViewDTO> result = receiptNoteService.getImportReportPaginated(0, 10, null, null, null, null, null, null, null, null);
        assertTrue(result.isEmpty());
    }
}
