package com.dev.backend.controller;

import com.dev.backend.dto.AuthResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "spring.sql.init.mode=never")
class EndToEndFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void savedToOfferHappyPath() throws Exception {
        String email = "e2e-" + UUID.randomUUID() + "@example.com";
        String password = "password-123";

        String signupPayload = """
                {
                  "email": "%s",
                  "password": "%s"
                }
                """.formatted(email, password);

        MvcResult signupResult = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupPayload))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse auth = objectMapper.readValue(
                signupResult.getResponse().getContentAsString(),
                AuthResponse.class
        );
        String token = "Bearer " + auth.getToken();

        String createPayload = """
                {
                  "company": "E2E Co",
                  "role": "Engineer"
                }
                """;

        MvcResult createResult = mockMvc.perform(post("/api/applications")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.stage", is("SAVED")))
                .andReturn();

        long appId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        transition(appId, token, "APPLIED");
        transition(appId, token, "INTERVIEW");
        transition(appId, token, "OFFER");
    }

    private void transition(long appId, String token, String stage) throws Exception {
        String payload = """
                {
                  "stage": "%s"
                }
                """.formatted(stage);

        mockMvc.perform(patch("/api/applications/{id}/stage", appId)
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stage", is(stage)));
    }
}
