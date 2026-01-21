package com.dev.backend.service;

import com.dev.backend.dto.ApplicationCreateRequest;
import com.dev.backend.model.Application;
import com.dev.backend.model.Stage;
import com.dev.backend.repository.ApplicationRepository;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;

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
}
