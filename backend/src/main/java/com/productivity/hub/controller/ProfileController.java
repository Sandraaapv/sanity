package com.productivity.hub.controller;

import com.productivity.hub.model.Profile;
import com.productivity.hub.model.User;
import com.productivity.hub.repository.ProfileRepository;
import com.productivity.hub.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;

    public ProfileController(ProfileRepository profileRepository, UserRepository userRepository) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UUID userId) {
        Profile profile = profileRepository.findById(userId).orElse(null);
        if (profile == null) {
            // Create a default profile if it doesn't exist
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }
            profile = new Profile(user, user.getEmail().split("@")[0]);
            profile = profileRepository.save(profile);
        }

        return ResponseEntity.ok(new ProfileDto(profile));
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal UUID userId, @RequestBody ProfileUpdateRequest request) {
        Profile profile = profileRepository.findById(userId).orElse(null);
        if (profile == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Profile not found");
        }

        if (request.getDisplayName() != null && !request.getDisplayName().trim().isEmpty()) {
            profile.setDisplayName(request.getDisplayName().trim());
        }
        if (request.getTimezone() != null) {
            profile.setTimezone(request.getTimezone());
        }
        if (request.getMailAlerts() != null) {
            profile.setMailAlerts(request.getMailAlerts());
        }

        Profile updated = profileRepository.save(profile);
        return ResponseEntity.ok(new ProfileDto(updated));
    }

    @PostMapping("/avatar")
    public ResponseEntity<?> uploadAvatar(@AuthenticationPrincipal UUID userId,
                                          @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        Profile profile = profileRepository.findById(userId).orElse(null);
        if (profile == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Profile not found");
        }

        try {
            // Setup local uploads folder
            String uploadDir = "uploads";
            File directory = new File(uploadDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            // Create a unique file name
            String extension = "";
            String originalFilename = file.getOriginalFilename();
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + extension;

            // Save the file locally
            Path filepath = Paths.get(uploadDir, filename);
            Files.write(filepath, file.getBytes());

            // Set the avatar URL
            String avatarUrl = "/uploads/" + filename;
            profile.setAvatarUrl(avatarUrl);
            profileRepository.save(profile);

            return ResponseEntity.ok(new AvatarResponse(avatarUrl));

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload avatar: " + e.getMessage());
        }
    }

    // --- DTO Classes ---

    public static class ProfileDto {
        private UUID id;
        private String email;
        private String displayName;
        private String avatarUrl;
        private String timezone;
        private boolean mailAlerts;

        public ProfileDto(Profile profile) {
            this.id = profile.getId();
            this.email = profile.getUser().getEmail();
            this.displayName = profile.getDisplayName();
            this.avatarUrl = profile.getAvatarUrl();
            this.timezone = profile.getTimezone();
            this.mailAlerts = profile.isMailAlerts();
        }

        public UUID getId() { return id; }
        public String getEmail() { return email; }
        public String getDisplayName() { return displayName; }
        public String getAvatarUrl() { return avatarUrl; }
        public String getTimezone() { return timezone; }
        public boolean isMailAlerts() { return mailAlerts; }
    }

    public static class ProfileUpdateRequest {
        private String displayName;
        private String timezone;
        private Boolean mailAlerts;

        public String getDisplayName() { return displayName; }
        public void setDisplayName(String displayName) { this.displayName = displayName; }
        public String getTimezone() { return timezone; }
        public void setTimezone(String timezone) { this.timezone = timezone; }
        public Boolean getMailAlerts() { return mailAlerts; }
        public void setMailAlerts(Boolean mailAlerts) { this.mailAlerts = mailAlerts; }
    }

    public static class AvatarResponse {
        private String avatarUrl;
        public AvatarResponse(String avatarUrl) { this.avatarUrl = avatarUrl; }
        public String getAvatarUrl() { return avatarUrl; }
    }
}
