package com.dev.backend.dto;

import com.dev.backend.model.AuditEvent;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuditEventResponse {
    private Long id;
    private String type;
    private String entityType;
    private Long entityId;
    private String payload;
    private String correlationId;
    private LocalDateTime createdAt;

    public static AuditEventResponse from(AuditEvent event) {
        return new AuditEventResponse(
                event.getId(),
                event.getEventType(),
                event.getEntityType(),
                event.getEntityId(),
                event.getPayload(),
                event.getCorrelationId(),
                event.getCreatedAt()
        );
    }
}
