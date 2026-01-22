package com.dev.backend.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DashboardNextActionsResponse {
    private List<TaskResponse> dueSoonTasks;
    private List<ApplicationResponse> staleApplications;
}
