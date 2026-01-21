package com.dev.backend.service;

import com.dev.backend.dto.ApplicationCreateRequest;
import com.dev.backend.dto.ApplicationUpdateRequest;
import com.dev.backend.model.Application;
import com.dev.backend.model.Stage;
import com.dev.backend.repository.ApplicationRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;

    public ApplicationService(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
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
        application.setNotes(request.getNotes());
        application.setLastTouchAt(LocalDateTime.now());
        return applicationRepository.save(application);
    }

    public void delete(Long userId, Long applicationId) {
        Application application = applicationRepository.findByIdAndUserId(applicationId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        applicationRepository.delete(application);
    }
}
