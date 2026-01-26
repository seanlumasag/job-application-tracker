package com.dev.backend.service;

import com.dev.backend.dto.ApplicationCreateRequest;
import com.dev.backend.dto.ApplicationUpdateRequest;
import com.dev.backend.model.Application;
import com.dev.backend.model.Stage;
import com.dev.backend.model.StageEvent;
import com.dev.backend.repository.ApplicationRepository;
import com.dev.backend.repository.StageEventRepository;
import com.dev.backend.repository.TaskRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final StageEventRepository stageEventRepository;
    private final TaskRepository taskRepository;
    private final AuditService auditService;

    public ApplicationService(
            ApplicationRepository applicationRepository,
            StageEventRepository stageEventRepository,
            TaskRepository taskRepository,
            AuditService auditService
    ) {
        this.applicationRepository = applicationRepository;
        this.stageEventRepository = stageEventRepository;
        this.taskRepository = taskRepository;
        this.auditService = auditService;
    }

    public Application create(Long userId, ApplicationCreateRequest request) {
        Application application = new Application();
        application.setCompany(request.getCompany());
        application.setRole(request.getRole());
        application.setJobUrl(request.getJobUrl());
        application.setLocation(request.getLocation());
        application.setNotes(request.getNotes());
        application.setStage(Stage.SAVED);
        application.setLastTouchAt(LocalDateTime.now());
        application.setUserId(userId);
        return applicationRepository.save(application);
    }

    public List<Application> list(Long userId, Stage stage) {
        Sort sort = Sort.by(Sort.Direction.DESC, "lastTouchAt");
        if (stage == null) {
            return applicationRepository.findAllByUserId(userId, sort);
        }
        return applicationRepository.findAllByUserIdAndStage(userId, stage, sort);
    }

    public List<Application> listStale(Long userId, int days) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(days);
        Sort sort = Sort.by(Sort.Direction.ASC, "lastTouchAt");
        return applicationRepository.findAllByUserIdAndLastTouchAtBefore(userId, cutoff, sort);
    }

    public Application update(Long userId, Long applicationId, ApplicationUpdateRequest request) {
        Application application = applicationRepository.findByIdAndUserId(applicationId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        application.setCompany(request.getCompany());
        application.setRole(request.getRole());
        application.setJobUrl(request.getJobUrl());
        application.setLocation(request.getLocation());
        application.setNotes(request.getNotes());
        application.setLastTouchAt(LocalDateTime.now());
        return applicationRepository.save(application);
    }

    @Transactional
    public void delete(Long userId, Long applicationId) {
        Application application = applicationRepository.findByIdAndUserId(applicationId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        taskRepository.deleteAllByApplicationIdAndApplicationUserId(applicationId, userId);
        stageEventRepository.deleteAllByApplicationIdAndApplicationUserId(applicationId, userId);
        applicationRepository.delete(application);
    }

    public List<StageEvent> listStageEvents(Long userId, Long applicationId) {
        applicationRepository.findByIdAndUserId(applicationId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        return stageEventRepository.findAllByApplicationIdAndApplicationUserIdOrderByCreatedAtDesc(applicationId, userId);
    }

    @Transactional
    public Application transitionStage(Long userId, Long applicationId, Stage nextStage) {
        Application application = applicationRepository.findByIdAndUserId(applicationId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        Stage currentStage = application.getStage();
        if (currentStage == nextStage) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stage is already set");
        }
        LocalDateTime now = LocalDateTime.now();
        application.setStage(nextStage);
        application.setLastTouchAt(now);
        application.setStageChangedAt(now);
        Application saved = applicationRepository.save(application);

        StageEvent event = new StageEvent();
        event.setApplication(saved);
        event.setFromStage(currentStage);
        event.setToStage(nextStage);
        event.setActor("user:" + userId);
        stageEventRepository.save(event);

        auditService.record(
                userId,
                "application.stage_changed",
                "application",
                saved.getId(),
                java.util.Map.of(
                        "fromStage", currentStage,
                        "toStage", nextStage,
                        "actor", "user:" + userId
                )
        );

        return saved;
    }
}
