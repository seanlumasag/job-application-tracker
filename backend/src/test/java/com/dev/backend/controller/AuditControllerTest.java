package com.dev.backend.controller;

import com.dev.backend.model.AuditEvent;
import com.dev.backend.model.User;
import com.dev.backend.repository.AuditEventRepository;
import com.dev.backend.repository.UserRepository;
import com.dev.backend.service.JwtService;
import java.time.LocalDateTime;
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
class AuditControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Test
    void auditFeedOrdersNewestFirstAndPaginates() throws Exception {
        User owner = createUser("audit-owner@example.com");

        AuditEvent older = buildEvent(owner.getId(), "older", LocalDateTime.now().minusDays(2));
        AuditEvent middle = buildEvent(owner.getId(), "middle", LocalDateTime.now().minusDays(1));
        AuditEvent newest = buildEvent(owner.getId(), "newest", LocalDateTime.now());
        auditEventRepository.save(older);
        auditEventRepository.save(middle);
        auditEventRepository.save(newest);

        mockMvc.perform(get("/api/audit-events")
                        .param("page", "0")
                        .param("size", "2")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].payload", is("\"newest\"")))
                .andExpect(jsonPath("$[1].payload", is("\"middle\"")));

        mockMvc.perform(get("/api/audit-events")
                        .param("page", "1")
                        .param("size", "2")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].payload", is("\"older\"")));
    }

    @Test
    void auditFeedReturnsOnlyOwnedEvents() throws Exception {
        User owner = createUser("audit-owner-2@example.com");
        User other = createUser("audit-other@example.com");

        auditEventRepository.save(buildEvent(owner.getId(), "owned", LocalDateTime.now().minusHours(2)));
        auditEventRepository.save(buildEvent(other.getId(), "other", LocalDateTime.now().minusHours(1)));

        mockMvc.perform(get("/api/audit-events")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].payload", is("\"owned\"")));
    }

    private AuditEvent buildEvent(Long userId, String payload, LocalDateTime createdAt) {
        AuditEvent event = new AuditEvent();
        event.setUserId(userId);
        event.setEventType("test.event");
        event.setEntityType("test");
        event.setEntityId(1L);
        event.setPayload("\"" + payload + "\"");
        event.setCreatedAt(createdAt);
        return event;
    }

    private User createUser(String email) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("hash");
        return userRepository.save(user);
    }

    private String bearerToken(User user) {
        return "Bearer " + jwtService.generateToken(user);
    }
}
