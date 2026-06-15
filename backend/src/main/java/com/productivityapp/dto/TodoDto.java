package com.productivityapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TodoDto {
    private Long id;
    private String title;
    private String description;
    private boolean completed;
    private String priority; // low, medium, high
    private LocalDateTime dueDate;
}