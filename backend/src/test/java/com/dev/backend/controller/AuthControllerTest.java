package com.dev.backend.controller;

import com.dev.backend.dto.AuthRequest;
import com.dev.backend.model.User;
import com.dev.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "spring.sql.init.mode=never")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void signupCreatesUserAndReturnsToken() throws Exception {
        AuthRequest request = new AuthRequest();
        request.setEmail("NewUser@example.com");
        request.setPassword("StrongPass123");

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").isNumber())
                .andExpect(jsonPath("$.email").value("newuser@example.com"))
                .andExpect(jsonPath("$.token").isString());

        User user = userRepository.findByEmail("newuser@example.com").orElseThrow();
        assertThat(user.getPasswordHash()).isNotEqualTo("StrongPass123");
    }

    @Test
    void signupRejectsDuplicateEmail() throws Exception {
        User existing = new User();
        existing.setEmail("duplicate@example.com");
        existing.setPasswordHash(passwordEncoder.encode("Password123"));
        userRepository.save(existing);

        AuthRequest request = new AuthRequest();
        request.setEmail("Duplicate@Example.com");
        request.setPassword("Password123");

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void signupRejectsInvalidPayload() throws Exception {
        AuthRequest request = new AuthRequest();
        request.setEmail("not-an-email");
        request.setPassword("short");

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void loginReturnsTokenForValidCredentials() throws Exception {
        User user = new User();
        user.setEmail("login@example.com");
        user.setPasswordHash(passwordEncoder.encode("Password123"));
        userRepository.save(user);

        AuthRequest request = new AuthRequest();
        request.setEmail("login@example.com");
        request.setPassword("Password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").isNumber())
                .andExpect(jsonPath("$.email").value("login@example.com"))
                .andExpect(jsonPath("$.token").isString());
    }

    @Test
    void loginRejectsInvalidPassword() throws Exception {
        User user = new User();
        user.setEmail("badpass@example.com");
        user.setPasswordHash(passwordEncoder.encode("Password123"));
        userRepository.save(user);

        AuthRequest request = new AuthRequest();
        request.setEmail("badpass@example.com");
        request.setPassword("WrongPassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginRejectsUnknownUser() throws Exception {
        AuthRequest request = new AuthRequest();
        request.setEmail("unknown@example.com");
        request.setPassword("Password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}
