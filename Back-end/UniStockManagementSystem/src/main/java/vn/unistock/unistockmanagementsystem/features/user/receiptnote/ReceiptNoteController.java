package vn.unistock.unistockmanagementsystem.features.user.receiptnote;

import com.azure.core.annotation.Get;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import vn.unistock.unistockmanagementsystem.entities.GoodReceiptNote;
import vn.unistock.unistockmanagementsystem.entities.User;
import vn.unistock.unistockmanagementsystem.features.user.purchaseOrder.PurchaseOrderDTO;
import vn.unistock.unistockmanagementsystem.features.user.purchaseRequests.PurchaseRequestDTO;
import vn.unistock.unistockmanagementsystem.security.filter.CustomUserDetails;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/unistock/user/receiptnote")
@RequiredArgsConstructor
public class ReceiptNoteController {
    @Autowired
    private final ReceiptNoteService receiptNoteService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllGoodReceipts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) List<String> categories,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        Page<ReceiptNoteDTO> notes = receiptNoteService.getAllReceiptNote(page, size, search, categories, startDate, endDate);
        Map<String, Object> response = new HashMap<>();
        response.put("content", notes.getContent());
        response.put("totalPages", notes.getTotalPages());
        response.put("totalElements", notes.getTotalElements());
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ReceiptNoteDTO> createGoodReceipt(@RequestBody ReceiptNoteDTO grnDto) {
        return ResponseEntity.ok(receiptNoteService.createGoodReceipt(grnDto));
    }

    @GetMapping("/{grnId}")
    public ResponseEntity<ReceiptNoteDTO> getGoodReceiptById(@PathVariable Long grnId) {
        ReceiptNoteDTO grn = receiptNoteService.getAllReceiptNoteById(grnId);
        if (grn == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Good Receipt Note not found");
        }
        return ResponseEntity.ok(grn);
    }

    @GetMapping("/nextcode")
    public ResponseEntity<String> getNextNoteCode() {
        String nextCode = receiptNoteService.getNextReceiptCode();
        return ResponseEntity.ok(nextCode);
    }

    @PostMapping("/upload-documents")
    public ResponseEntity<?> uploadPaperEvidence(
            @RequestParam("noteId") Long noteId,
            @RequestParam("noteType") String noteType,
            @RequestParam("files") List<MultipartFile> files) {

        // Get current authenticated user
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }

        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        User currentUser = userDetails.getUser();

        try {
            List<String> fileUrls = receiptNoteService.uploadPaperEvidence(noteId, noteType, files, currentUser);
            return ResponseEntity.ok().body(fileUrls);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload files: " + e.getMessage());
        }
    }
    //endpoint receipt report
    @GetMapping("/report")
    public ResponseEntity<Map<String, Object>> getImportReportPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String itemType, // "PRODUCT" | "MATERIAL"
            @RequestParam(required = false) List<Long> warehouseIds,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) List<String> categories,
            @RequestParam(required = false) Double minQuantity,
            @RequestParam(required = false) Double maxQuantity
    ) {
        Page<ReceiptNoteDetailViewDTO> paged = receiptNoteService.getImportReportPaginated(
                page, size, search, itemType, warehouseIds, startDate, endDate, categories, minQuantity, maxQuantity
        );
        Map<String, Object> response = new HashMap<>();
        response.put("content", paged.getContent());
        response.put("totalPages", paged.getTotalPages());
        response.put("totalElements", paged.getTotalElements());
        return ResponseEntity.ok(response);
    }

}
