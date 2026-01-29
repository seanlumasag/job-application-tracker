package com.dev.backend.controller;

import com.dev.backend.dto.DeleteAccountRequest;
import com.dev.backend.security.JwtAuthFilter;
import com.dev.backend.service.AuthService;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MeController {

    private final AuthService authService;

    public MeController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/api/me")
    public Map<String, Object> me(HttpServletRequest request) {
        UUID userId = (UUID) request.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        String email = (String) request.getAttribute(JwtAuthFilter.USER_EMAIL_ATTR);
        return Map.of("userId", userId, "email", email);
    }

    @DeleteMapping("/api/me")
    public ResponseEntity<Void> deleteAccount(
            @Valid @RequestBody DeleteAccountRequest deleteAccountRequest,
            HttpServletRequest request
    ) {
        UUID userId = (UUID) request.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        authService.deleteAccount(userId, deleteAccountRequest.getPassword());
        return ResponseEntity.noContent().build();
    }
}
