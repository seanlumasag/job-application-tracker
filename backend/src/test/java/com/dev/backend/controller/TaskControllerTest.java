package com.dev.backend.controller;

import com.dev.backend.model.Application;
import com.dev.backend.model.Task;
import com.dev.backend.model.TaskStatus;
import com.dev.backend.model.User;
import com.dev.backend.repository.ApplicationRepository;
import com.dev.backend.repository.TaskRepository;
import com.dev.backend.repository.UserRepository;
import com.dev.backend.service.JwtService;
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

    private User createUser(String email) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("hash");
        return userRepository.save(user);
    }

    private Application createApplication(Long userId, String company, String role) {
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
