package com.productivityapp.service;

import com.productivityapp.dto.UserDto;
import com.productivityapp.entity.User;
import com.productivityapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class UserService {
    private final UserRepository userRepository;
    
    @Value("${app.upload.dir}")
    private String uploadDir;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getEntityByUsername(String username) {
        return userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public UserDto updateProfile(String username, UserDto dto) {
        User user = getEntityByUsername(username);
        user.setDisplayName(dto.getDisplayName());
        user.setThemePreference(dto.getThemePreference());
        user.setAccentColor(dto.getAccentColor());
        user.setTimezone(dto.getTimezone());
        user.setEmailRemindersEnabled(dto.isEmailRemindersEnabled());
        return mapToDto(userRepository.save(user));
    }

    public UserDto uploadAvatar(String username, MultipartFile file) throws IOException {
        User user = getEntityByUsername(username);
        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();

        String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadDir, filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Saved as clean mapping link relative to server domain root
        String relativeUrl = "/uploads/" + filename;
        user.setAvatarUrl(relativeUrl);
        return mapToDto(userRepository.save(user));
    }

    public UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .themePreference(user.getThemePreference())
                .accentColor(user.getAccentColor())
                .timezone(user.getTimezone())
                .emailRemindersEnabled(user.isEmailRemindersEnabled())
                .build();
    }
}