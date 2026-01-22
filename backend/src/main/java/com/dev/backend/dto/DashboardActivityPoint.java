package com.dev.backend.dto;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DashboardActivityPoint {
    private LocalDate date;
    private long stageTransitions;
    private long taskCompletions;
}
