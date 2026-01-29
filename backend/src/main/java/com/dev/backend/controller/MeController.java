package com.dev.backend.controller;

import com.dev.backend.security.JwtAuthFilter;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MeController {

    @GetMapping("/api/me")
    public Map<String, Object> me(HttpServletRequest request) {
        UUID userId = (UUID) request.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        String email = (String) request.getAttribute(JwtAuthFilter.USER_EMAIL_ATTR);
        return Map.of("userId", userId, "email", email);
    }
}
