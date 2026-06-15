package com.productivityapp.controller;
import com.productivityapp.dto.UserDto;
import com.productivityapp.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.security.Principal;

@RestController
@RequestMapping("/api/user")
public class UserController {
    private final UserService userService;
    public UserController(UserService userService) { this.userService = userService; }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getMe(Principal principal) {
        return ResponseEntity.ok(userService.mapToDto(userService.getEntityByUsername(principal.getName())));
    }

    @PatchMapping("/profile")
    public ResponseEntity<UserDto> updateProfile(@RequestBody UserDto dto, Principal principal) {
        return ResponseEntity.ok(userService.updateProfile(principal.getName(), dto));
    }

    @PostMapping("/avatar")
    public ResponseEntity<UserDto> uploadAvatar(@RequestParam("file") MultipartFile file, Principal principal) throws IOException {
        return ResponseEntity.ok(userService.uploadAvatar(principal.getName(), file));
    }
}