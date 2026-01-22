package com.dev.backend.service;

import com.dev.backend.dto.TaskCreateRequest;
import com.dev.backend.model.Application;
import com.dev.backend.model.Task;
import com.dev.backend.model.TaskStatus;
import com.dev.backend.repository.ApplicationRepository;
import com.dev.backend.repository.TaskRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ApplicationRepository applicationRepository;

    public TaskService(TaskRepository taskRepository, ApplicationRepository applicationRepository) {
        this.taskRepository = taskRepository;
        this.applicationRepository = applicationRepository;
    }

    public Task create(Long userId, Long applicationId, TaskCreateRequest request) {
        Application application = applicationRepository.findByIdAndUserId(applicationId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        Task task = new Task();
        task.setApplication(application);
        task.setTitle(request.getTitle());
        task.setDueAt(request.getDueAt());
        task.setNotes(request.getNotes());
        task.setStatus(TaskStatus.OPEN);
        return taskRepository.save(task);
    }

    public List<Task> listForApplication(Long userId, Long applicationId) {
        Application application = applicationRepository.findByIdAndUserId(applicationId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        Sort sort = Sort.by(Sort.Direction.ASC, "dueAt").and(Sort.by(Sort.Direction.ASC, "createdAt"));
        return taskRepository.findAllByApplicationId(application.getId(), sort);
    }

    @Transactional
    public Task updateStatus(Long userId, Long taskId, TaskStatus status) {
        Task task = taskRepository.findByIdAndApplicationUserId(taskId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        task.setStatus(status);
        if (status == TaskStatus.DONE) {
            task.setCompletedAt(LocalDateTime.now());
        } else {
            task.setCompletedAt(null);
        }
        return taskRepository.save(task);
    }
}
