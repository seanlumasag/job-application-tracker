package com.dev.backend.dto;

import com.dev.backend.model.Stage;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DashboardSummaryResponse {
    private Map<Stage, Long> stageCounts;
    private long overdueTasks;
}
