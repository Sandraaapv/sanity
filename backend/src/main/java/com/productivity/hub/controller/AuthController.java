package com.productivity.hub.controller;

import com.productivity.hub.config.JwtTokenProvider;
import com.productivity.hub.model.Profile;
import com.productivity.hub.model.User;
import com.productivity.hub.repository.ProfileRepository;
import com.productivity.hub.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthController(UserRepository userRepository,
                          ProfileRepository profileRepository,
                          PasswordEncoder passwordEncoder,
                          JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new ErrorResponse("Email address already in use."));
        }

        // Creating user's account
        User user = new User(signUpRequest.getEmail(), passwordEncoder.encode(signUpRequest.getPassword()));
        User savedUser = userRepository.save(user);

        // Creating user's profile
        String displayName = signUpRequest.getDisplayName();
        if (displayName == null || displayName.trim().isEmpty()) {
            displayName = signUpRequest.getEmail().split("@")[0];
        }
        Profile profile = new Profile(savedUser, displayName);
        profileRepository.save(profile);

        String jwt = tokenProvider.generateToken(savedUser.getId());
        return ResponseEntity.ok(new AuthResponse(jwt, savedUser.getId(), savedUser.getEmail(), displayName));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Invalid email or password."));
        }

        Profile profile = profileRepository.findById(user.getId()).orElse(null);
        String displayName = profile != null ? profile.getDisplayName() : user.getEmail().split("@")[0];

        String jwt = tokenProvider.generateToken(user.getId());
        return ResponseEntity.ok(new AuthResponse(jwt, user.getId(), user.getEmail(), displayName));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UUID userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("Not authenticated."));
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("User not found."));
        }
        Profile profile = profileRepository.findById(userId).orElse(null);
        String displayName = profile != null ? profile.getDisplayName() : user.getEmail().split("@")[0];
        return ResponseEntity.ok(new UserResponse(user.getId(), user.getEmail(), displayName));
    }

    // --- DTO Classes ---

    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be a valid email address")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class SignupRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be a valid email address")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        private String displayName;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getDisplayName() { return displayName; }
        public void setDisplayName(String displayName) { this.displayName = displayName; }
    }

    public static class AuthResponse {
        private String token;
        private UUID id;
        private String email;
        private String displayName;

        public AuthResponse(String token, UUID id, String email, String displayName) {
            this.token = token;
            this.id = id;
            this.email = email;
            this.displayName = displayName;
        }

        public String getToken() { return token; }
        public UUID getId() { return id; }
        public String getEmail() { return email; }
        public String getDisplayName() { return displayName; }
    }

    public static class UserResponse {
        private UUID id;
        private String email;
        private String displayName;

        public UserResponse(UUID id, String email, String displayName) {
            this.id = id;
            this.email = email;
            this.displayName = displayName;
        }

        public UUID getId() { return id; }
        public String getEmail() { return email; }
        public String getDisplayName() { return displayName; }
    }

    public static class ErrorResponse {
        private String message;
        public ErrorResponse(String message) { this.message = message; }
        public String getMessage() { return message; }
    }
}
