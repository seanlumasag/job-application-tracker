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

    public JwtAuthFilter(JwtService jwtService, ObjectMapper objectMapper) {
        this.jwtService = jwtService;
        this.objectMapper = objectMapper;
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
}
