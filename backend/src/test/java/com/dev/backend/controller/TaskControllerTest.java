package com.dev.backend.controller;

import com.dev.backend.model.Application;
import com.dev.backend.model.Task;
import com.dev.backend.model.TaskStatus;
import com.dev.backend.model.User;
import com.dev.backend.repository.ApplicationRepository;
import com.dev.backend.repository.TaskRepository;
import com.dev.backend.repository.UserRepository;
import com.dev.backend.service.JwtService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.WeekFields;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "spring.sql.init.mode=never")
class TaskControllerTest {

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

    @Test
    void createTaskRequiresAuth() throws Exception {
        User owner = createUser("task-auth@example.com");
        Application application = createApplication(owner.getId(), "TaskCo", "Engineer");

        String payload = """
                {
                  "title": "Follow up",
                  "notes": "Email recruiter"
                }
                """;

        mockMvc.perform(post("/api/applications/{id}/tasks", application.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createTaskForOwnedApplication() throws Exception {
        User owner = createUser("task-create@example.com");
        Application application = createApplication(owner.getId(), "TaskCreateCo", "Engineer");

        String payload = """
                {
                  "title": "Follow up",
                  "notes": "Email recruiter"
                }
                """;

        mockMvc.perform(post("/api/applications/{id}/tasks", application.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title", is("Follow up")))
                .andExpect(jsonPath("$.status", is("OPEN")))
                .andExpect(jsonPath("$.applicationId", is(application.getId().intValue())));

        assertThat(taskRepository.findAllByApplicationId(application.getId(), org.springframework.data.domain.Sort.unsorted()))
                .hasSize(1);
    }

    @Test
    void listTasksReturnsOnlyOwnedRows() throws Exception {
        User owner = createUser("task-list-owner@example.com");
        User other = createUser("task-list-other@example.com");
        Application ownerApp = createApplication(owner.getId(), "OwnerTaskCo", "Engineer");
        Application otherApp = createApplication(other.getId(), "OtherTaskCo", "Analyst");

        Task ownerTask = new Task();
        ownerTask.setApplication(ownerApp);
        ownerTask.setTitle("Owner task");
        ownerTask.setStatus(TaskStatus.OPEN);
        taskRepository.save(ownerTask);

        Task otherTask = new Task();
        otherTask.setApplication(otherApp);
        otherTask.setTitle("Other task");
        otherTask.setStatus(TaskStatus.OPEN);
        taskRepository.save(otherTask);

        mockMvc.perform(get("/api/applications/{id}/tasks", ownerApp.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title", is("Owner task")));
    }

    @Test
    void markTaskDoneAndUndoneUpdatesCompletedAt() throws Exception {
        User owner = createUser("task-done@example.com");
        Application application = createApplication(owner.getId(), "TaskDoneCo", "Engineer");
        Task task = new Task();
        task.setApplication(application);
        task.setTitle("Complete me");
        task.setStatus(TaskStatus.OPEN);
        task = taskRepository.save(task);

        String donePayload = """
                {
                  "status": "DONE"
                }
                """;

        mockMvc.perform(patch("/api/tasks/{id}/status", task.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(donePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("DONE")))
                .andExpect(jsonPath("$.completedAt", notNullValue()));

        Task doneTask = taskRepository.findById(task.getId()).orElseThrow();
        assertThat(doneTask.getCompletedAt()).isNotNull();

        String openPayload = """
                {
                  "status": "OPEN"
                }
                """;

        mockMvc.perform(patch("/api/tasks/{id}/status", task.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(openPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("OPEN")))
                .andExpect(jsonPath("$.completedAt", is((Object) null)));

        Task reopened = taskRepository.findById(task.getId()).orElseThrow();
        assertThat(reopened.getCompletedAt()).isNull();
    }

    @Test
    void dueTodayReturnsOnlyOpenUnsnoozedTasks() throws Exception {
        User owner = createUser("task-due-today@example.com");
        Application application = createApplication(owner.getId(), "DueTodayCo", "Engineer");
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        Task dueToday = new Task();
        dueToday.setApplication(application);
        dueToday.setTitle("Due today");
        dueToday.setStatus(TaskStatus.OPEN);
        dueToday.setDueAt(startOfDay.plusHours(9));
        taskRepository.save(dueToday);

        Task snoozed = new Task();
        snoozed.setApplication(application);
        snoozed.setTitle("Snoozed today");
        snoozed.setStatus(TaskStatus.OPEN);
        snoozed.setDueAt(startOfDay.plusHours(10));
        snoozed.setSnoozeUntil(LocalDateTime.now().plusDays(1));
        taskRepository.save(snoozed);

        Task doneToday = new Task();
        doneToday.setApplication(application);
        doneToday.setTitle("Done today");
        doneToday.setStatus(TaskStatus.DONE);
        doneToday.setDueAt(startOfDay.plusHours(8));
        taskRepository.save(doneToday);

        Task dueTomorrow = new Task();
        dueTomorrow.setApplication(application);
        dueTomorrow.setTitle("Due tomorrow");
        dueTomorrow.setStatus(TaskStatus.OPEN);
        dueTomorrow.setDueAt(startOfDay.plusDays(1).plusHours(1));
        taskRepository.save(dueTomorrow);

        mockMvc.perform(get("/api/tasks/due/today")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title", is("Due today")));
    }

    @Test
    void dueThisWeekHonorsWeekWindow() throws Exception {
        User owner = createUser("task-due-week@example.com");
        Application application = createApplication(owner.getId(), "DueWeekCo", "Engineer");
        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.with(WeekFields.ISO.dayOfWeek(), 1);

        Task inWeek = new Task();
        inWeek.setApplication(application);
        inWeek.setTitle("In week");
        inWeek.setStatus(TaskStatus.OPEN);
        inWeek.setDueAt(startOfWeek.atStartOfDay().plusDays(2).plusHours(9));
        taskRepository.save(inWeek);

        Task nextWeek = new Task();
        nextWeek.setApplication(application);
        nextWeek.setTitle("Next week");
        nextWeek.setStatus(TaskStatus.OPEN);
        nextWeek.setDueAt(startOfWeek.atStartOfDay().plusWeeks(1).plusHours(1));
        taskRepository.save(nextWeek);

        mockMvc.perform(get("/api/tasks/due/week")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title", is("In week")));
    }

    @Test
    void overdueReturnsOnlyBeforeToday() throws Exception {
        User owner = createUser("task-overdue@example.com");
        Application application = createApplication(owner.getId(), "OverdueCo", "Engineer");
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        Task overdue = new Task();
        overdue.setApplication(application);
        overdue.setTitle("Overdue");
        overdue.setStatus(TaskStatus.OPEN);
        overdue.setDueAt(startOfDay.minusHours(2));
        taskRepository.save(overdue);

        Task today = new Task();
        today.setApplication(application);
        today.setTitle("Today");
        today.setStatus(TaskStatus.OPEN);
        today.setDueAt(startOfDay.plusHours(1));
        taskRepository.save(today);

        mockMvc.perform(get("/api/tasks/overdue")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title", is("Overdue")));
    }

    private User createUser(String email) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("hash");
        return userRepository.save(user);
    }

    private Application createApplication(java.util.UUID userId, String company, String role) {
        Application application = new Application();
        application.setCompany(company);
        application.setRole(role);
        application.setUserId(userId);
        return applicationRepository.save(application);
    }

    private String bearerToken(User user) {
        return "Bearer " + jwtService.generateToken(user);
    }
}
