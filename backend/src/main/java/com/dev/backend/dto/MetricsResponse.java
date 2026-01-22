package com.dev.backend.dto;

import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MetricsResponse {
    private OffsetDateTime timestamp;
    private long users;
    private long applications;
    private long tasks;
    private long stageEvents;
    private long auditEvents;
}
