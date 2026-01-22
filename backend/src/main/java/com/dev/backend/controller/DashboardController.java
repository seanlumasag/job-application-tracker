package com.dev.backend.controller;

import com.dev.backend.dto.DashboardActivityResponse;
import com.dev.backend.dto.DashboardNextActionsResponse;
import com.dev.backend.dto.DashboardSummaryResponse;
import com.dev.backend.dto.ApplicationResponse;
import com.dev.backend.security.JwtAuthFilter;
import com.dev.backend.service.DashboardService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@Validated
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public DashboardSummaryResponse summary(HttpServletRequest servletRequest) {
        Long userId = (Long) servletRequest.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return dashboardService.summary(userId);
    }

    @GetMapping("/stale")
    public List<ApplicationResponse> stale(
            @RequestParam(name = "days", defaultValue = "30") @Min(1) @Max(365) int days,
            HttpServletRequest servletRequest
    ) {
        Long userId = (Long) servletRequest.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return dashboardService.staleApplications(userId, days);
    }

    @GetMapping("/next-actions")
    public DashboardNextActionsResponse nextActions(
            @RequestParam(name = "days", defaultValue = "7") @Min(1) @Max(90) int days,
            HttpServletRequest servletRequest
    ) {
        Long userId = (Long) servletRequest.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return dashboardService.nextActions(userId, days);
    }

    @GetMapping("/activity")
    public DashboardActivityResponse activity(
            @RequestParam(name = "days", defaultValue = "7") @Min(1) @Max(90) int days,
            HttpServletRequest servletRequest
    ) {
        Long userId = (Long) servletRequest.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return dashboardService.activity(userId, days);
    }
}
