package com.dev.backend.service;

import com.dev.backend.dto.DashboardActivityPoint;
import com.dev.backend.dto.DashboardActivityResponse;
import com.dev.backend.dto.DashboardNextActionsResponse;
import com.dev.backend.dto.DashboardSummaryResponse;
import com.dev.backend.dto.ApplicationResponse;
import com.dev.backend.dto.TaskResponse;
import com.dev.backend.model.Stage;
import com.dev.backend.model.StageEvent;
import com.dev.backend.model.Task;
import com.dev.backend.repository.ApplicationRepository;
import com.dev.backend.repository.StageEventRepository;
import com.dev.backend.repository.TaskRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final ApplicationRepository applicationRepository;
    private final TaskRepository taskRepository;
    private final StageEventRepository stageEventRepository;

    public DashboardService(
            ApplicationRepository applicationRepository,
            TaskRepository taskRepository,
            StageEventRepository stageEventRepository
    ) {
        this.applicationRepository = applicationRepository;
        this.taskRepository = taskRepository;
        this.stageEventRepository = stageEventRepository;
    }

    public DashboardSummaryResponse summary(UUID userId) {
        Map<Stage, Long> stageCounts = new EnumMap<>(Stage.class);
        applicationRepository.countByStage(userId).forEach(count -> stageCounts.put(count.getStage(), count.getTotal()));
        for (Stage stage : Stage.values()) {
            stageCounts.putIfAbsent(stage, 0L);
        }
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long overdueTasks = taskRepository.countOverdue(userId, startOfDay, LocalDateTime.now());
        return new DashboardSummaryResponse(stageCounts, overdueTasks);
    }

    public List<ApplicationResponse> staleApplications(UUID userId, int days) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(days);
        Sort sort = Sort.by(Sort.Direction.ASC, "lastTouchAt");
        return applicationRepository.findAllByUserIdAndLastTouchAtBefore(userId, cutoff, sort).stream()
                .map(ApplicationResponse::from)
                .collect(Collectors.toList());
    }

    public DashboardNextActionsResponse nextActions(UUID userId, int days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime end = now.plusDays(days);
        List<TaskResponse> dueSoonTasks = taskRepository.findDueSoon(userId, now, end, now).stream()
                .map(TaskResponse::from)
                .collect(Collectors.toList());

        LocalDateTime cutoff = now.minusDays(days);
        List<Stage> terminalStages = List.of(Stage.REJECTED, Stage.WITHDRAWN);
        Sort sort = Sort.by(Sort.Direction.ASC, "lastTouchAt");
        List<ApplicationResponse> staleApplications = applicationRepository
                .findAllByUserIdAndLastTouchAtBeforeAndStageNotIn(userId, cutoff, terminalStages, sort).stream()
                .map(ApplicationResponse::from)
                .collect(Collectors.toList());

        return new DashboardNextActionsResponse(dueSoonTasks, staleApplications);
    }

    public DashboardActivityResponse activity(UUID userId, int days) {
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(days - 1L);
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime endExclusive = today.plusDays(1).atStartOfDay();

        List<StageEvent> stageEvents = stageEventRepository
                .findAllByApplicationUserIdAndCreatedAtBetween(userId, start, endExclusive);
        List<Task> completedTasks = taskRepository
                .findAllByApplicationUserIdAndCompletedAtBetween(userId, start, endExclusive);

        Map<LocalDate, Long> stageCounts = stageEvents.stream()
                .collect(Collectors.groupingBy(event -> event.getCreatedAt().toLocalDate(), Collectors.counting()));
        Map<LocalDate, Long> taskCounts = completedTasks.stream()
                .collect(Collectors.groupingBy(task -> task.getCompletedAt().toLocalDate(), Collectors.counting()));

        List<DashboardActivityPoint> items = startDate.datesUntil(today.plusDays(1))
                .map(date -> new DashboardActivityPoint(
                        date,
                        stageCounts.getOrDefault(date, 0L),
                        taskCounts.getOrDefault(date, 0L)
                ))
                .collect(Collectors.toList());

        return new DashboardActivityResponse(days, items);
    }
}
