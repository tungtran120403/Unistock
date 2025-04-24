package vn.unistock.unistockmanagementsystem.features.user.issueNote;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import vn.unistock.unistockmanagementsystem.entities.User;
import vn.unistock.unistockmanagementsystem.security.filter.CustomUserDetails;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/unistock/user/issuenote")
@RequiredArgsConstructor
public class IssueNoteController {

    @Autowired
    private final IssueNoteService issueNoteService;

    /**
     * API lấy danh sách phiếu xuất kho (có phân trang).
     * GET /api/unistock/user/issuenote?page=0&size=10
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllIssueNotes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        // Gọi service để lấy dữ liệu Page<IssueNoteDTO>
        Page<IssueNoteDTO> notesPage = issueNoteService.getAllIssueNotes(page, size);

        // Tạo cấu trúc JSON trả về tương tự: { content, totalPages, totalElements }
        Map<String, Object> response = new HashMap<>();
        response.put("content", notesPage.getContent());
        response.put("totalPages", notesPage.getTotalPages());
        response.put("totalElements", notesPage.getTotalElements());

        return ResponseEntity.ok(response);
    }

    /**
     * API tạo mới một phiếu xuất kho.
     * POST /api/unistock/user/issuenote
     * Body JSON: IssueNoteDTO (chứa ginCode, issueDate, category, details, ...)
     */
    @PostMapping
    public ResponseEntity<IssueNoteDTO> createIssueNote(@RequestBody IssueNoteDTO dto) {
        IssueNoteDTO createdNote = issueNoteService.createGoodIssue(dto);
        return ResponseEntity.status(HttpStatus.OK).body(createdNote);
    }

    /**
     * API lấy chi tiết một phiếu xuất kho theo ID.
     * GET /api/unistock/user/issuenote/{issueNoteId}
     *
     * Chú ý: Trong IssueNoteService, bạn có thể cần hàm getIssueNoteById()
     *        để lấy chi tiết từ DB và map ra DTO.
     */
    @GetMapping("/{issueNoteId}")
    public ResponseEntity<IssueNoteDTO> getIssueNoteById(@PathVariable Long issueNoteId) {
        IssueNoteDTO noteDTO = null;
        try {
            noteDTO = issueNoteService.getIssueNoteById(issueNoteId);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
        if (noteDTO == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue Note not found");
        }
        return ResponseEntity.ok(noteDTO);
    }

    /**
     * API lấy mã phiếu xuất kho kế tiếp.
     * GET /api/unistock/user/issuenote/nextcode
     */
    @GetMapping("/nextcode")
    public ResponseEntity<String> getNextIssueCode() {
        String nextCode = issueNoteService.getNextIssueCode();
        return ResponseEntity.ok(nextCode);
    }

    /**
     * API upload file đính kèm cho phiếu xuất kho.
     * POST /api/unistock/user/issuenote/upload-documents
     *
     * Truyền lên noteId, noteType = GOOD_ISSUE_NOTE, và list multipart files
     * VD: form-data: { "noteId":..., "noteType":"GOOD_ISSUE_NOTE", "files":[...multipart...] }
     */
    @PostMapping("/upload-documents")
    public ResponseEntity<?> uploadPaperEvidence(
            @RequestParam("noteId") Long noteId,
            @RequestParam("noteType") String noteType,
            @RequestParam("files") List<MultipartFile> files
    ) {
        // Lấy user đang đăng nhập
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        User currentUser = userDetails.getUser();

        try {
            List<String> fileUrls = issueNoteService.uploadPaperEvidence(noteId, noteType, files, currentUser);
            return ResponseEntity.ok().body(fileUrls);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload files: " + e.getMessage());
        }
    }

    @GetMapping("/report")
    public ResponseEntity<Map<String, Object>> getExportReport(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String itemType,
            @RequestParam(required = false) Double minQuantity,
            @RequestParam(required = false) Double maxQuantity,
            @RequestParam(required = false) List<String> categories,
            @RequestParam(required = false) List<Long> warehouseIds
    ) {
        Page<IssueNoteReportDTO> paged = issueNoteService.getFilteredExportReport(
                page, size, search, startDate, endDate, itemType, minQuantity, maxQuantity, categories, warehouseIds
        );
        Map<String, Object> response = new HashMap<>();
        response.put("content", paged.getContent());
        response.put("totalPages", paged.getTotalPages());
        response.put("totalElements", paged.getTotalElements());
        return ResponseEntity.ok(response);
    }

}
