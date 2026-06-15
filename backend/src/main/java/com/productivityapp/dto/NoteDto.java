package com.productivityapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteDto {
    private Long id;
    private String title;
    private String content;
    private String color;
    private boolean isPinned;
}