package com.dev.backend.controller;

import com.dev.backend.model.Application;
import com.dev.backend.model.Stage;
import com.dev.backend.model.StageEvent;
import com.dev.backend.model.Task;
import com.dev.backend.model.TaskStatus;
import com.dev.backend.model.User;
import com.dev.backend.repository.ApplicationRepository;
import com.dev.backend.repository.StageEventRepository;
import com.dev.backend.repository.TaskRepository;
import com.dev.backend.repository.UserRepository;
import com.dev.backend.service.JwtService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "spring.sql.init.mode=never")
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private StageEventRepository stageEventRepository;

    @Test
    void summaryReturnsStageCountsAndOverdue() throws Exception {
        User owner = createUser("summary-owner@example.com");
        User other = createUser("summary-other@example.com");

        Application savedApp = createApplication(owner.getId(), "SavedCo", "Engineer", Stage.SAVED);
        createApplication(owner.getId(), "AppliedCo", "Engineer", Stage.APPLIED);
        createApplication(owner.getId(), "RejectedCo", "Engineer", Stage.REJECTED);
        Application otherApp = createApplication(other.getId(), "OtherCo", "Engineer", Stage.APPLIED);

        Task overdue = createTask(savedApp, "Overdue", TaskStatus.OPEN);
        overdue.setDueAt(LocalDate.now().minusDays(1).atStartOfDay().plusHours(8));
        taskRepository.save(overdue);

        Task snoozed = createTask(savedApp, "Snoozed", TaskStatus.OPEN);
        snoozed.setDueAt(LocalDate.now().minusDays(2).atStartOfDay().plusHours(9));
        snoozed.setSnoozeUntil(LocalDateTime.now().plusDays(1));
        taskRepository.save(snoozed);

        Task otherOverdue = createTask(otherApp, "Other overdue", TaskStatus.OPEN);
        otherOverdue.setDueAt(LocalDate.now().minusDays(1).atStartOfDay().plusHours(10));
        taskRepository.save(otherOverdue);

        mockMvc.perform(get("/api/dashboard/summary")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stageCounts.SAVED", is(1)))
                .andExpect(jsonPath("$.stageCounts.APPLIED", is(1)))
                .andExpect(jsonPath("$.stageCounts.REJECTED", is(1)))
                .andExpect(jsonPath("$.stageCounts.INTERVIEW", is(0)))
                .andExpect(jsonPath("$.stageCounts.OFFER", is(0)))
                .andExpect(jsonPath("$.stageCounts.WITHDRAWN", is(0)))
                .andExpect(jsonPath("$.overdueTasks", is(1)));
    }

    @Test
    void staleEndpointReturnsOldRows() throws Exception {
        User owner = createUser("stale-owner@example.com");
        Application stale = createApplication(owner.getId(), "OldCo", "Engineer", Stage.SAVED);
        stale.setLastTouchAt(LocalDateTime.now().minusDays(40));
        applicationRepository.save(stale);
        Application recent = createApplication(owner.getId(), "NewCo", "Engineer", Stage.SAVED);
        recent.setLastTouchAt(LocalDateTime.now().minusDays(5));
        applicationRepository.save(recent);

        mockMvc.perform(get("/api/dashboard/stale")
                        .param("days", "30")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].company", is("OldCo")));
    }

    @Test
    void nextActionsReturnsDueSoonTasksAndStaleActiveApps() throws Exception {
        User owner = createUser("next-owner@example.com");
        Application staleActive = createApplication(owner.getId(), "StaleActive", "Engineer", Stage.APPLIED);
        staleActive.setLastTouchAt(LocalDateTime.now().minusDays(10));
        applicationRepository.save(staleActive);
        Application staleRejected = createApplication(owner.getId(), "StaleRejected", "Engineer", Stage.REJECTED);
        staleRejected.setLastTouchAt(LocalDateTime.now().minusDays(10));
        applicationRepository.save(staleRejected);

        Application taskApp = createApplication(owner.getId(), "NextTaskApp", "Engineer", Stage.SAVED);
        Task dueSoon = createTask(taskApp, "Due soon", TaskStatus.OPEN);
        dueSoon.setDueAt(LocalDateTime.now().plusDays(3));
        taskRepository.save(dueSoon);
        Task dueLater = createTask(taskApp, "Due later", TaskStatus.OPEN);
        dueLater.setDueAt(LocalDateTime.now().plusDays(15));
        taskRepository.save(dueLater);

        mockMvc.perform(get("/api/dashboard/next-actions")
                        .param("days", "7")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueSoonTasks", hasSize(1)))
                .andExpect(jsonPath("$.dueSoonTasks[0].title", is("Due soon")))
                .andExpect(jsonPath("$.staleApplications", hasSize(1)))
                .andExpect(jsonPath("$.staleApplications[0].company", is("StaleActive")));
    }

    @Test
    void activityEndpointReturnsDailyCounts() throws Exception {
        User owner = createUser("activity-owner@example.com");
        Application application = createApplication(owner.getId(), "ActivityCo", "Engineer", Stage.SAVED);

        LocalDate today = LocalDate.now();
        LocalDateTime twoDaysAgo = today.minusDays(2).atStartOfDay().plusHours(9);
        LocalDateTime yesterday = today.minusDays(1).atStartOfDay().plusHours(11);

        StageEvent event = new StageEvent();
        event.setApplication(application);
        event.setFromStage(Stage.SAVED);
        event.setToStage(Stage.APPLIED);
        event.setCreatedAt(twoDaysAgo);
        stageEventRepository.save(event);

        Task completed = new Task();
        completed.setApplication(application);
        completed.setTitle("Complete");
        completed.setStatus(TaskStatus.DONE);
        completed.setCompletedAt(yesterday);
        taskRepository.save(completed);

        int days = 7;
        LocalDate startDate = today.minusDays(days - 1L);
        int transitionIndex = (int) ChronoUnit.DAYS.between(startDate, twoDaysAgo.toLocalDate());
        int completionIndex = (int) ChronoUnit.DAYS.between(startDate, yesterday.toLocalDate());

        mockMvc.perform(get("/api/dashboard/activity")
                        .param("days", String.valueOf(days))
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(days)))
                .andExpect(jsonPath(String.format("$.items[%d].stageTransitions", transitionIndex), is(1)))
                .andExpect(jsonPath(String.format("$.items[%d].taskCompletions", completionIndex), is(1)));
    }

    private User createUser(String email) {
        User user = new User();
        String uniqueEmail = email.replace("@", "+" + java.util.UUID.randomUUID() + "@");
        user.setEmail(uniqueEmail);
        user.setPasswordHash("hash");
        return userRepository.save(user);
    }

    private Application createApplication(Long userId, String company, String role, Stage stage) {
        Application application = new Application();
        application.setCompany(company);
        application.setRole(role);
        application.setStage(stage);
        application.setUserId(userId);
        return applicationRepository.save(application);
    }

    private Task createTask(Application application, String title, TaskStatus status) {
        Task task = new Task();
        task.setApplication(application);
        task.setTitle(title);
        task.setStatus(status);
        return task;
    }

    private String bearerToken(User user) {
        return "Bearer " + jwtService.generateToken(user);
    }
}
