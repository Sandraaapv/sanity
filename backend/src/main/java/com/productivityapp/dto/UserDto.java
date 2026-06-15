package com.productivityapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String displayName;
    private String avatarUrl;
    private String themePreference;
    private String accentColor;
    private String timezone;
    private boolean emailRemindersEnabled;
}