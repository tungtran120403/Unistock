package vn.unistock.unistockmanagementsystem.features.profile;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.unistock.unistockmanagementsystem.entities.User;
import vn.unistock.unistockmanagementsystem.features.admin.user.UserRepository;
import vn.unistock.unistockmanagementsystem.security.Jwt;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/unistock/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final Jwt jwt;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("")
    public ResponseEntity<UserProfileDTO> getProfile(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if(authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String token = authHeader.substring(7);
        String email = jwt.extractEmail(token);
        if(email == null || email.isEmpty()){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(profileService.getProfile(email));
    }

    @PutMapping("")
    public ResponseEntity<UserProfileDTO> updateProfile(HttpServletRequest request,
                                                        @RequestBody UserProfileDTO dto) {
        String authHeader = request.getHeader("Authorization");
        if(authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String token = authHeader.substring(7);
        String email = jwt.extractEmail(token);
        if(email == null || email.isEmpty()){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(profileService.updateProfile(email, dto));
    }



    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(HttpServletRequest request,
                                                 @RequestBody ChangePasswordDTO dto) {
        String authHeader = request.getHeader("Authorization");
        if(authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String token = authHeader.substring(7);
        String email = jwt.extractEmail(token);
        if(email == null || email.isEmpty()){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        profileService.changePassword(email, dto);
        return ResponseEntity.ok("Password changed successfully");
    }

    @PostMapping("/avatar")
    public ResponseEntity<String> uploadAvatar(HttpServletRequest request,
                                               @RequestParam("avatar") MultipartFile file) throws IOException {
        String authHeader = request.getHeader("Authorization");
        if(authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String token = authHeader.substring(7);
        String email = jwt.extractEmail(token);
        if(email == null || email.isEmpty()){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String avatarUrl = profileService.uploadAvatar(email, file);
        return ResponseEntity.ok(avatarUrl);
    }
}
