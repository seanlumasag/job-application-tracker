package com.dev.backend.dto;

import com.dev.backend.model.Task;
import com.dev.backend.model.TaskStatus;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TaskResponse {
    private Long id;
    private Long applicationId;
    private String title;
    private TaskStatus status;
    private LocalDateTime dueAt;
    private LocalDateTime snoozeUntil;
    private String notes;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getApplication().getId(),
                task.getTitle(),
                task.getStatus(),
                task.getDueAt(),
                task.getSnoozeUntil(),
                task.getNotes(),
                task.getCompletedAt(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }
}
