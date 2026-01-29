package com.dev.backend.controller;

import com.dev.backend.dto.TaskCreateRequest;
import com.dev.backend.dto.TaskResponse;
import com.dev.backend.dto.TaskStatusUpdateRequest;
import com.dev.backend.dto.TaskUpdateRequest;
import com.dev.backend.security.JwtAuthFilter;
import com.dev.backend.service.TaskService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping("/applications/{applicationId}/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse create(
            @PathVariable("applicationId") Long applicationId,
            @Valid @RequestBody TaskCreateRequest request,
            HttpServletRequest servletRequest
    ) {
        UUID userId = (UUID) servletRequest.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return TaskResponse.from(taskService.create(userId, applicationId, request));
    }

    @GetMapping("/applications/{applicationId}/tasks")
    public List<TaskResponse> listForApplication(
            @PathVariable("applicationId") Long applicationId,
            HttpServletRequest servletRequest
    ) {
        UUID userId = (UUID) servletRequest.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return taskService.listForApplication(userId, applicationId).stream()
                .map(TaskResponse::from)
                .collect(Collectors.toList());
    }

    @PatchMapping("/tasks/{id}/status")
    public TaskResponse updateStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody TaskStatusUpdateRequest request,
            HttpServletRequest servletRequest
    ) {
        UUID userId = (UUID) servletRequest.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return TaskResponse.from(taskService.updateStatus(userId, id, request.getStatus()));
    }

    @PutMapping("/tasks/{id}")
    public TaskResponse update(
            @PathVariable("id") Long id,
            @Valid @RequestBody TaskUpdateRequest request,
            HttpServletRequest servletRequest
    ) {
        UUID userId = (UUID) servletRequest.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return TaskResponse.from(taskService.update(userId, id, request));
    }

    @GetMapping("/tasks/due/today")
    public List<TaskResponse> listDueToday(HttpServletRequest servletRequest) {
        UUID userId = (UUID) servletRequest.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return taskService.listDueToday(userId).stream()
                .map(TaskResponse::from)
                .collect(Collectors.toList());
    }

    @GetMapping("/tasks/due/week")
    public List<TaskResponse> listDueThisWeek(HttpServletRequest servletRequest) {
        UUID userId = (UUID) servletRequest.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return taskService.listDueThisWeek(userId).stream()
                .map(TaskResponse::from)
                .collect(Collectors.toList());
    }

    @GetMapping("/tasks/overdue")
    public List<TaskResponse> listOverdue(HttpServletRequest servletRequest) {
        UUID userId = (UUID) servletRequest.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return taskService.listOverdue(userId).stream()
                .map(TaskResponse::from)
                .collect(Collectors.toList());
    }
}
