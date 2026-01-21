package com.dev.backend.controller;

import com.dev.backend.dto.ApplicationCreateRequest;
import com.dev.backend.dto.ApplicationResponse;
import com.dev.backend.dto.ApplicationUpdateRequest;
import com.dev.backend.model.Stage;
import com.dev.backend.security.JwtAuthFilter;
import com.dev.backend.service.ApplicationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationResponse create(
            @Valid @RequestBody ApplicationCreateRequest request,
            HttpServletRequest servletRequest
    ) {
        Long userId = (Long) servletRequest.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return ApplicationResponse.from(applicationService.create(userId, request));
    }

    @GetMapping
    public List<ApplicationResponse> list(
            @RequestParam(name = "stage", required = false) Stage stage,
            HttpServletRequest servletRequest
    ) {
        Long userId = (Long) servletRequest.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return applicationService.list(userId, stage).stream()
                .map(ApplicationResponse::from)
                .collect(Collectors.toList());
    }

    @PutMapping("/{id}")
    public ApplicationResponse update(
            @PathVariable("id") Long id,
            @Valid @RequestBody ApplicationUpdateRequest request,
            HttpServletRequest servletRequest
    ) {
        Long userId = (Long) servletRequest.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return ApplicationResponse.from(applicationService.update(userId, id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable("id") Long id,
            HttpServletRequest servletRequest
    ) {
        Long userId = (Long) servletRequest.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        applicationService.delete(userId, id);
    }
}
