package com.dev.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class TaskCreateRequest {
    @NotBlank
    @Size(max = 255)
    private String title;

    private LocalDateTime dueAt;

    @Size(max = 2000)
    private String notes;
}
