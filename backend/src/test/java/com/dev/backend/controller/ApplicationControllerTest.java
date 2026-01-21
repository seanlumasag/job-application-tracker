package com.dev.backend.controller;

import com.dev.backend.dto.ApplicationUpdateRequest;
import com.dev.backend.model.Application;
import com.dev.backend.model.Stage;
import com.dev.backend.model.User;
import com.dev.backend.repository.ApplicationRepository;
import com.dev.backend.repository.UserRepository;
import com.dev.backend.service.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.greaterThan;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "spring.sql.init.mode=never")
class ApplicationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Test
    void listApplicationsReturnsOnlyOwnedRows() throws Exception {
        User owner = createUser("owner@example.com");
        User other = createUser("other@example.com");
        Application owned = createApplication(owner.getId(), "OwnerCo", "Engineer");
        createApplication(other.getId(), "OtherCo", "Analyst");

        mockMvc.perform(get("/api/applications")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(owned.getId().intValue())));
    }

    @Test
    void listApplicationsRequiresAuth() throws Exception {
        mockMvc.perform(get("/api/applications"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listApplicationsRejectsInvalidStage() throws Exception {
        User owner = createUser("stage-invalid@example.com");

        mockMvc.perform(get("/api/applications")
                        .param("stage", "NOT_A_STAGE")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listApplicationsFiltersByStageAndSortsByLastTouch() throws Exception {
        User owner = createUser("stage-owner@example.com");
        Application savedOld = createApplication(owner.getId(), "OldSaved", "Engineer");
        savedOld.setLastTouchAt(LocalDateTime.now().minusDays(10));
        applicationRepository.save(savedOld);
        Application savedNew = createApplication(owner.getId(), "NewSaved", "Engineer");
        savedNew.setLastTouchAt(LocalDateTime.now().minusDays(2));
        applicationRepository.save(savedNew);
        Application applied = createApplication(owner.getId(), "AppliedCo", "Analyst");
        applied.setStage(Stage.APPLIED);
        applicationRepository.save(applied);

        mockMvc.perform(get("/api/applications")
                        .param("stage", "SAVED")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id", is(savedNew.getId().intValue())))
                .andExpect(jsonPath("$[1].id", is(savedOld.getId().intValue())));
    }

    @Test
    void createApplicationSetsDefaults() throws Exception {
        User owner = createUser("create-owner@example.com");

        String payload = """
                {
                  "company": "CreateCo",
                  "role": "Engineer",
                  "jobUrl": "https://example.com/job",
                  "notes": "Initial"
                }
                """;

        mockMvc.perform(post("/api/applications")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", greaterThan(0)))
                .andExpect(jsonPath("$.company", is("CreateCo")))
                .andExpect(jsonPath("$.role", is("Engineer")))
                .andExpect(jsonPath("$.stage", is("SAVED")))
                .andExpect(jsonPath("$.lastTouchAt", notNullValue()));
    }

    @Test
    void createApplicationRequiresAuth() throws Exception {
        String payload = """
                {
                  "company": "CreateCo",
                  "role": "Engineer"
                }
                """;

        mockMvc.perform(post("/api/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createApplicationRejectsInvalidPayload() throws Exception {
        User owner = createUser("create-invalid@example.com");

        String payload = """
                {
                  "company": "",
                  "role": ""
                }
                """;

        mockMvc.perform(post("/api/applications")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateBlocksOtherUsers() throws Exception {
        User owner = createUser("update-owner@example.com");
        User other = createUser("update-other@example.com");
        Application otherApp = createApplication(other.getId(), "OtherCo", "Analyst");

        ApplicationUpdateRequest request = new ApplicationUpdateRequest();
        request.setCompany("NewCo");
        request.setRole("Manager");
        request.setJobUrl("https://example.com/job");
        request.setNotes("Updated");

        mockMvc.perform(put("/api/applications/{id}", otherApp.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateRequiresAuth() throws Exception {
        User owner = createUser("update-auth@example.com");
        Application app = createApplication(owner.getId(), "OldCo", "Engineer");

        ApplicationUpdateRequest request = new ApplicationUpdateRequest();
        request.setCompany("NewCo");
        request.setRole("Manager");

        mockMvc.perform(put("/api/applications/{id}", app.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateApplicationPersistsChanges() throws Exception {
        User owner = createUser("update-success@example.com");
        Application app = createApplication(owner.getId(), "OldCo", "Engineer");

        ApplicationUpdateRequest request = new ApplicationUpdateRequest();
        request.setCompany("NewCo");
        request.setRole("Manager");
        request.setJobUrl("https://example.com/job");
        request.setNotes("Updated");

        mockMvc.perform(put("/api/applications/{id}", app.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.company", is("NewCo")))
                .andExpect(jsonPath("$.role", is("Manager")));
    }

    @Test
    void updateRejectsInvalidPayload() throws Exception {
        User owner = createUser("update-invalid@example.com");
        Application app = createApplication(owner.getId(), "OldCo", "Engineer");

        String payload = """
                {
                  "company": "",
                  "role": ""
                }
                """;

        mockMvc.perform(put("/api/applications/{id}", app.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteBlocksOtherUsers() throws Exception {
        User owner = createUser("delete-owner@example.com");
        User other = createUser("delete-other@example.com");
        Application otherApp = createApplication(other.getId(), "OtherCo", "Analyst");

        mockMvc.perform(delete("/api/applications/{id}", otherApp.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteRequiresAuth() throws Exception {
        User owner = createUser("delete-auth@example.com");
        Application app = createApplication(owner.getId(), "DeleteCo", "Engineer");

        mockMvc.perform(delete("/api/applications/{id}", app.getId()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteRemovesOwnedApplication() throws Exception {
        User owner = createUser("delete-success@example.com");
        Application app = createApplication(owner.getId(), "DeleteCo", "Engineer");

        mockMvc.perform(delete("/api/applications/{id}", app.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/applications")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void staleQueryReturnsOnlyOwnedRows() throws Exception {
        User owner = createUser("stale-owner@example.com");
        User other = createUser("stale-other@example.com");
        Application owned = createApplication(owner.getId(), "OldCo", "Engineer");
        owned.setLastTouchAt(LocalDateTime.now().minusDays(45));
        applicationRepository.save(owned);

        Application otherApp = createApplication(other.getId(), "OtherOldCo", "Analyst");
        otherApp.setLastTouchAt(LocalDateTime.now().minusDays(60));
        applicationRepository.save(otherApp);

        mockMvc.perform(get("/api/applications/stale")
                        .param("days", "30")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(owned.getId().intValue())));
    }

    @Test
    void staleQueryRejectsInvalidDays() throws Exception {
        User owner = createUser("stale-invalid@example.com");

        mockMvc.perform(get("/api/applications/stale")
                        .param("days", "0")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner)))
                .andExpect(status().isBadRequest());
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
        application.setStage(Stage.SAVED);
        application.setUserId(userId);
        return applicationRepository.save(application);
    }

    private String bearerToken(User user) {
        return "Bearer " + jwtService.generateToken(user);
    }
}
