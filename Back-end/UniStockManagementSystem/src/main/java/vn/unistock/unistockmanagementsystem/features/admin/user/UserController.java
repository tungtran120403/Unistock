package vn.unistock.unistockmanagementsystem.features.admin.user;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/unistock/admin/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<UserDTO> addUser(@RequestBody UserDTO userDTO) {
        UserDTO newUser = userService.createUser(userDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(newUser);
    }

    @GetMapping("/check-email")
    public ResponseEntity<Boolean> checkEmailExists(@RequestParam String email) {
        boolean exists = userService.checkEmailExists(email);
        System.out.println("📢 API kiểm tra email: " + email + " - Kết quả: " + exists);
        return ResponseEntity.ok(exists);
    }


    // 🟢 API: Lấy danh sách Users
    @GetMapping
    public ResponseEntity<Page<UserDTO>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(userService.getAllUsers(page, size));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<UserDTO> updateStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> status) {
        UserDTO updatedUser = userService.updateUserStatus(id, status.get("isActive"));
        return ResponseEntity.ok(updatedUser);
    }

    // 🟢 API: Lấy User theo ID
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserByUserId(id));
    }


    // 🟢 API: Xóa User
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable Long userId,
            @RequestBody UserDTO updatedUserDTO) {
        UserDTO updatedUser = userService.updateUser(userId, updatedUserDTO);
        return ResponseEntity.ok(updatedUser);
    }
}
