package com.dev.backend.dto;

import com.dev.backend.model.Application;
import com.dev.backend.model.Stage;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ApplicationResponse {
    private Long id;
    private String company;
    private String role;
    private String jobUrl;
    private String location;
    private String notes;
    private Stage stage;
    private LocalDateTime lastTouchAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ApplicationResponse from(Application application) {
        return new ApplicationResponse(
                application.getId(),
                application.getCompany(),
                application.getRole(),
                application.getJobUrl(),
                application.getLocation(),
                application.getNotes(),
                application.getStage(),
                application.getLastTouchAt(),
                application.getCreatedAt(),
                application.getUpdatedAt()
        );
    }
}
