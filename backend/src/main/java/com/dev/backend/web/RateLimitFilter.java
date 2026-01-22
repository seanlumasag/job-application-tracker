package com.dev.backend.web;

import com.dev.backend.dto.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();
    private static final List<String> AUTH_PATHS = List.of("/api/auth/**");
    private static final List<String> SENSITIVE_PATHS = List.of(
            "/api/tasks/*/status",
            "/api/applications/*/stage",
            "/api/audit-events"
    );

    private final ObjectMapper objectMapper;
    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();

    private final int authLimit;
    private final int authWindowSeconds;
    private final int sensitiveLimit;
    private final int sensitiveWindowSeconds;

    public RateLimitFilter(
            ObjectMapper objectMapper,
            @Value("${app.rate-limit.auth.requests:100}") int authLimit,
            @Value("${app.rate-limit.auth.window-seconds:60}") int authWindowSeconds,
            @Value("${app.rate-limit.sensitive.requests:120}") int sensitiveLimit,
            @Value("${app.rate-limit.sensitive.window-seconds:60}") int sensitiveWindowSeconds
    ) {
        this.objectMapper = objectMapper;
        this.authLimit = authLimit;
        this.authWindowSeconds = authWindowSeconds;
        this.sensitiveLimit = sensitiveLimit;
        this.sensitiveWindowSeconds = sensitiveWindowSeconds;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String path = request.getRequestURI();
        String clientId = clientId(request);

        if (matches(path, AUTH_PATHS)) {
            if (!allow(clientId + ":auth", authLimit, authWindowSeconds)) {
                writeRateLimited(request, response);
                return;
            }
        } else if (matches(path, SENSITIVE_PATHS)) {
            if (!allow(clientId + ":sensitive", sensitiveLimit, sensitiveWindowSeconds)) {
                writeRateLimited(request, response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean allow(String key, int limit, int windowSeconds) {
        long now = System.currentTimeMillis();
        WindowCounter counter = counters.compute(key, (ignored, existing) -> {
            if (existing == null || now - existing.windowStart >= windowSeconds * 1000L) {
                return new WindowCounter(now, new AtomicInteger(1));
            }
            existing.counter.incrementAndGet();
            return existing;
        });
        return counter.counter.get() <= limit;
    }

    private boolean matches(String path, List<String> patterns) {
        return patterns.stream().anyMatch(pattern -> PATH_MATCHER.match(pattern, path));
    }

    private String clientId(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private void writeRateLimited(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ErrorResponse body = new ErrorResponse(
                OffsetDateTime.now(),
                HttpStatus.TOO_MANY_REQUESTS.value(),
                "rate_limited",
                "Too many requests",
                request.getRequestURI(),
                List.of()
        );
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }

    private static class WindowCounter {
        private final long windowStart;
        private final AtomicInteger counter;

        private WindowCounter(long windowStart, AtomicInteger counter) {
            this.windowStart = windowStart;
            this.counter = counter;
        }
    }
}
