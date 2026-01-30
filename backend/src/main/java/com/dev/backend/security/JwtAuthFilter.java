package com.dev.backend.security;

import com.dev.backend.dto.ErrorResponse;
import com.dev.backend.service.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    public static final String USER_ID_ATTR = "authUserId";
    public static final String USER_EMAIL_ATTR = "authUserEmail";

    private final JwtService jwtService;
    private final ObjectMapper objectMapper;
    private final List<String> allowedOrigins;

    public JwtAuthFilter(
            JwtService jwtService,
            ObjectMapper objectMapper,
            @Value("${app.cors.allowed-origins:*}") String allowedOrigins
    ) {
        this.jwtService = jwtService;
        this.objectMapper = objectMapper;
        this.allowedOrigins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .collect(Collectors.toList());
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        if (path.startsWith("/api/auth/")) {
            return path.equals("/api/auth/signup")
                    || path.equals("/api/auth/login")
                    || path.equals("/api/auth/refresh")
                    || path.equals("/api/auth/logout")
                    || path.equals("/api/auth/verify-email")
                    || path.equals("/api/auth/verify-email/resend")
                    || path.equals("/api/auth/password/forgot")
                    || path.equals("/api/auth/password/reset");
        }
        return "/api/health".equals(path) || "/api/metrics".equals(path);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith("Bearer ")) {
            writeUnauthorized(request, response, "Missing bearer token");
            return;
        }

        String token = header.substring("Bearer ".length()).trim();
        if (token.isEmpty()) {
            writeUnauthorized(request, response, "Missing bearer token");
            return;
        }

        try {
            AuthenticatedUser user = jwtService.parseToken(token);
            request.setAttribute(USER_ID_ATTR, user.getId());
            request.setAttribute(USER_EMAIL_ATTR, user.getEmail());
            filterChain.doFilter(request, response);
        } catch (JwtException ex) {
            writeUnauthorized(request, response, "Invalid token");
        }
    }

    private void writeUnauthorized(HttpServletRequest request, HttpServletResponse response, String message)
            throws IOException {
        addCorsHeaders(request, response);
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ErrorResponse body = new ErrorResponse(
                java.time.OffsetDateTime.now(),
                HttpStatus.UNAUTHORIZED.value(),
                "unauthorized",
                message,
                request.getRequestURI(),
                java.util.List.of()
        );
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }

    private void addCorsHeaders(HttpServletRequest request, HttpServletResponse response) {
        String origin = request.getHeader(HttpHeaders.ORIGIN);
        if (origin == null || origin.isBlank()) {
            return;
        }
        if (!allowedOrigins.isEmpty() && !allowedOrigins.contains("*") && !allowedOrigins.contains(origin)) {
            return;
        }
        response.setHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, origin);
        response.setHeader(HttpHeaders.VARY, HttpHeaders.ORIGIN);
        response.setHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS, "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        response.setHeader(
                HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS,
                "Authorization, Content-Type, Accept, Origin, X-Requested-With"
        );
    }
}
