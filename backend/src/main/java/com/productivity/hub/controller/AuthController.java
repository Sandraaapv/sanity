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
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.web.client.HttpClientErrorException;

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

    @PostMapping("/google")
    public ResponseEntity<?> authenticateGoogleUser(@Valid @RequestBody GoogleLoginRequest request) {
        SupabaseUser supabaseUser = verifySupabaseToken(request.getToken());
        if (supabaseUser == null || supabaseUser.getEmail() == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Invalid Google token or account."));
        }

        String email = supabaseUser.getEmail();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            // Register a new user
            user = new User(email, passwordEncoder.encode(UUID.randomUUID().toString()));
            user = userRepository.save(user);
        }

        Profile profile = profileRepository.findById(user.getId()).orElse(null);
        String displayName = null;
        if (profile == null) {
            displayName = email.split("@")[0];
            if (supabaseUser.getUser_metadata() != null) {
                if (supabaseUser.getUser_metadata().getFull_name() != null && !supabaseUser.getUser_metadata().getFull_name().trim().isEmpty()) {
                    displayName = supabaseUser.getUser_metadata().getFull_name();
                } else if (supabaseUser.getUser_metadata().getName() != null && !supabaseUser.getUser_metadata().getName().trim().isEmpty()) {
                    displayName = supabaseUser.getUser_metadata().getName();
                }
            }
            profile = new Profile(user, displayName);
            profileRepository.save(profile);
        } else {
            displayName = profile.getDisplayName();
        }

        String jwt = tokenProvider.generateToken(user.getId());
        return ResponseEntity.ok(new AuthResponse(jwt, user.getId(), user.getEmail(), displayName));
    }

    private SupabaseUser verifySupabaseToken(String token) {
        String supabaseUrl = System.getenv("SUPABASE_URL");
        if (supabaseUrl == null || supabaseUrl.isEmpty()) {
            supabaseUrl = "https://uopjhgncifhemyjdbuoy.supabase.co";
        }
        
        String supabaseKey = System.getenv("SUPABASE_PUBLISHABLE_KEY");
        if (supabaseKey == null || supabaseKey.isEmpty()) {
            supabaseKey = "sb_publishable_czB3_DN-o_wj2gKaN6gIsg_-1GC8gyq";
        }

        String url = supabaseUrl + "/auth/v1/user";
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.set("apikey", supabaseKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            return restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    SupabaseUser.class
            ).getBody();
        } catch (HttpClientErrorException e) {
            return null;
        } catch (Exception e) {
            return null;
        }
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

    public static class GoogleLoginRequest {
        @NotBlank(message = "Token is required")
        private String token;

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
    }

    public static class SupabaseUser {
        private String id;
        private String email;
        private UserMetadata user_metadata;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public UserMetadata getUser_metadata() { return user_metadata; }
        public void setUser_metadata(UserMetadata user_metadata) { this.user_metadata = user_metadata; }

        public static class UserMetadata {
            private String name;
            private String full_name;

            public String getName() { return name; }
            public void setName(String name) { this.name = name; }
            public String getFull_name() { return full_name; }
            public void setFull_name(String full_name) { this.full_name = full_name; }
        }
    }

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
