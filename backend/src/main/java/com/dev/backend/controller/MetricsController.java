package com.dev.backend.controller;

import com.dev.backend.dto.MetricsResponse;
import com.dev.backend.repository.ApplicationRepository;
import com.dev.backend.repository.AuditEventRepository;
import com.dev.backend.repository.StageEventRepository;
import com.dev.backend.repository.TaskRepository;
import com.dev.backend.repository.UserRepository;
import java.time.OffsetDateTime;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/metrics")
public class MetricsController {

    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final TaskRepository taskRepository;
    private final StageEventRepository stageEventRepository;
    private final AuditEventRepository auditEventRepository;

    public MetricsController(
            UserRepository userRepository,
            ApplicationRepository applicationRepository,
            TaskRepository taskRepository,
            StageEventRepository stageEventRepository,
            AuditEventRepository auditEventRepository
    ) {
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
        this.taskRepository = taskRepository;
        this.stageEventRepository = stageEventRepository;
        this.auditEventRepository = auditEventRepository;
    }

    @GetMapping
    public MetricsResponse metrics() {
        return new MetricsResponse(
                OffsetDateTime.now(),
                userRepository.count(),
                applicationRepository.count(),
                taskRepository.count(),
                stageEventRepository.count(),
                auditEventRepository.count()
        );
    }
}
