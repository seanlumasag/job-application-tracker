package com.dev.backend.dto;

import com.dev.backend.model.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TaskStatusUpdateRequest {
    @NotNull
    private TaskStatus status;
}
