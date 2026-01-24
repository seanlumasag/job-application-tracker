package com.dev.backend.dto;

import com.dev.backend.model.Stage;
import com.dev.backend.model.StageEvent;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StageEventResponse {
    private Long id;
    private Long applicationId;
    private Stage fromStage;
    private Stage toStage;
    private String note;
    private String actor;
    private LocalDateTime createdAt;

    public static StageEventResponse from(StageEvent event) {
        return new StageEventResponse(
                event.getId(),
                event.getApplication().getId(),
                event.getFromStage(),
                event.getToStage(),
                event.getNote(),
                event.getActor(),
                event.getCreatedAt()
        );
    }
}
