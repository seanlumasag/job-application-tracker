package com.dev.backend.service;

import com.dev.backend.dto.TaskCreateRequest;
import com.dev.backend.dto.TaskUpdateRequest;
import com.dev.backend.model.Application;
import com.dev.backend.model.Task;
import com.dev.backend.model.TaskStatus;
import com.dev.backend.repository.ApplicationRepository;
import com.dev.backend.repository.TaskRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ApplicationRepository applicationRepository;
    private final AuditService auditService;

    public TaskService(
            TaskRepository taskRepository,
            ApplicationRepository applicationRepository,
            AuditService auditService
    ) {
        this.taskRepository = taskRepository;
        this.applicationRepository = applicationRepository;
        this.auditService = auditService;
    }

    public Task create(UUID userId, Long applicationId, TaskCreateRequest request) {
        Application application = applicationRepository.findByIdAndUserId(applicationId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        Task task = new Task();
        task.setApplication(application);
        task.setTitle(request.getTitle());
        task.setDueAt(request.getDueAt());
        task.setSnoozeUntil(request.getSnoozeUntil());
        task.setNotes(request.getNotes());
        task.setStatus(TaskStatus.OPEN);
        Task saved = taskRepository.save(task);
        java.util.Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("applicationId", applicationId);
        payload.put("title", saved.getTitle());
        payload.put("dueAt", saved.getDueAt());
        payload.put("actor", "user:" + userId);
        auditService.record(
                userId,
                "task.created",
                "task",
                saved.getId(),
                payload
        );
        return saved;
    }

    public List<Task> listForApplication(UUID userId, Long applicationId) {
        Application application = applicationRepository.findByIdAndUserId(applicationId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        Sort sort = Sort.by(Sort.Direction.ASC, "dueAt").and(Sort.by(Sort.Direction.ASC, "createdAt"));
        return taskRepository.findAllByApplicationId(application.getId(), sort);
    }

    public Task update(UUID userId, Long taskId, TaskUpdateRequest request) {
        Task task = taskRepository.findByIdAndApplicationUserId(taskId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        task.setTitle(request.getTitle());
        task.setDueAt(request.getDueAt());
        task.setSnoozeUntil(request.getSnoozeUntil());
        task.setNotes(request.getNotes());
        return taskRepository.save(task);
    }

    @Transactional
    public Task updateStatus(UUID userId, Long taskId, TaskStatus status) {
        Task task = taskRepository.findByIdAndApplicationUserId(taskId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        TaskStatus previousStatus = task.getStatus();
        task.setStatus(status);
        if (status == TaskStatus.DONE) {
            task.setCompletedAt(LocalDateTime.now());
        } else {
            task.setCompletedAt(null);
        }
        Task saved = taskRepository.save(task);
        if (status == TaskStatus.DONE && previousStatus != TaskStatus.DONE) {
            auditService.record(
                    userId,
                    "task.completed",
                    "task",
                    saved.getId(),
                    java.util.Map.of(
                            "applicationId", saved.getApplication().getId(),
                            "completedAt", saved.getCompletedAt(),
                            "actor", "user:" + userId,
                            "title", saved.getTitle()
                    )
            );
        }
        return saved;
    }

    public List<Task> listDueToday(UUID userId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime startOfTomorrow = startOfDay.plusDays(1);
        Sort sort = Sort.by(Sort.Direction.ASC, "dueAt");
        List<Task> tasks = taskRepository
                .findAllByApplicationUserIdAndStatusAndDueAtGreaterThanEqualAndDueAtLessThan(
                        userId,
                        TaskStatus.OPEN,
                        startOfDay,
                        startOfTomorrow,
                        sort
                );
        return filterSnoozed(tasks, LocalDateTime.now());
    }

    public List<Task> listDueThisWeek(UUID userId) {
        LocalDate today = LocalDate.now();
        LocalDate startOfWeekDate = today.with(java.time.temporal.WeekFields.ISO.dayOfWeek(), 1);
        LocalDateTime startOfWeek = startOfWeekDate.atStartOfDay();
        LocalDateTime startOfNextWeek = startOfWeek.plusWeeks(1);
        Sort sort = Sort.by(Sort.Direction.ASC, "dueAt");
        List<Task> tasks = taskRepository
                .findAllByApplicationUserIdAndStatusAndDueAtGreaterThanEqualAndDueAtLessThan(
                        userId,
                        TaskStatus.OPEN,
                        startOfWeek,
                        startOfNextWeek,
                        sort
                );
        return filterSnoozed(tasks, LocalDateTime.now());
    }

    public List<Task> listOverdue(UUID userId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        Sort sort = Sort.by(Sort.Direction.ASC, "dueAt");
        List<Task> tasks = taskRepository.findAllByApplicationUserIdAndStatusAndDueAtLessThan(
                userId,
                TaskStatus.OPEN,
                startOfDay,
                sort
        );
        return filterSnoozed(tasks, LocalDateTime.now());
    }

    private List<Task> filterSnoozed(List<Task> tasks, LocalDateTime now) {
        return tasks.stream()
                .filter(task -> task.getSnoozeUntil() == null || !task.getSnoozeUntil().isAfter(now))
                .toList();
    }
}
