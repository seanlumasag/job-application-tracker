package com.dev.backend.controller;

import com.dev.backend.dto.AuditEventResponse;
import com.dev.backend.security.JwtAuthFilter;
import com.dev.backend.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@Validated
@RequestMapping("/api/audit-events")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    public List<AuditEventResponse> list(
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "25") @Min(1) @Max(100) int size,
            HttpServletRequest servletRequest
    ) {
        Long userId = (Long) servletRequest.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return auditService.listForUser(userId, page, size).stream()
                .map(AuditEventResponse::from)
                .collect(Collectors.toList());
    }
}
