//package vn.unistock.unistockmanagementsystem.features.user.user;
//
//import lombok.RequiredArgsConstructor;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.GetMapping;
//import org.springframework.web.bind.annotation.PathVariable;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RestController;
//import vn.unistock.unistockmanagementsystem.features.admin.user.UserDTO;
//import vn.unistock.unistockmanagementsystem.features.admin.user.UserService;
//
//@RestController
//@RequestMapping("/api/unistock/user/user")
//@RequiredArgsConstructor
//public class UserController {
//    private final UserService userService;
//    @GetMapping("/{id}")
//    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
//        return ResponseEntity.ok(userService.getUserByUserId(id));
//    }
//}
