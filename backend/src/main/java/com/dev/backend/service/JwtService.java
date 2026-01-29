package com.dev.backend.service;

import com.dev.backend.model.User;
import com.dev.backend.security.AuthenticatedUser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final Key signingKey;
    private final long expirationSeconds;
    private final boolean allowDevSecrets;

    public JwtService(
            @Value("${jwt.secret:dev-secret-change-me-please-change-32chars}") String secret,
            @Value("${jwt.expiration-seconds:86400}") long expirationSeconds,
            @Value("${app.security.allow-dev-secrets:true}") boolean allowDevSecrets
    ) {
        this.allowDevSecrets = allowDevSecrets;
        this.signingKey = Keys.hmacShaKeyFor(normalizeSecret(secret));
        this.expirationSeconds = expirationSeconds;
    }

    public String generateToken(User user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(expirationSeconds);

        return Jwts.builder()
                .setSubject(user.getId().toString())
                .claim("email", user.getEmail())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiresAt))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public AuthenticatedUser parseToken(String token) {
        try {
            Jws<Claims> claims = Jwts.parserBuilder()
                    .setSigningKey(signingKey)
                    .build()
                    .parseClaimsJws(token);
            String subject = claims.getBody().getSubject();
            if (subject == null || subject.isBlank()) {
                throw new JwtException("Missing subject");
            }
            UUID userId = UUID.fromString(subject);
            String email = claims.getBody().get("email", String.class);
            return new AuthenticatedUser(userId, email);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new JwtException("Invalid token", ex);
        }
    }

    private byte[] normalizeSecret(String secret) {
        String trimmed = secret == null ? "" : secret.trim();
        if (trimmed.isEmpty()) {
            if (!allowDevSecrets) {
                throw new IllegalStateException("JWT secret is required");
            }
            trimmed = "dev-secret-change-me-please-change-32chars";
        }
        byte[] bytes = trimmed.getBytes(StandardCharsets.UTF_8);
        if (bytes.length >= 32) {
            return bytes;
        }
        if (!allowDevSecrets) {
            throw new IllegalStateException("JWT secret must be at least 32 bytes");
        }
        String padded = trimmed + "00000000000000000000000000000000";
        return padded.getBytes(StandardCharsets.UTF_8);
    }
}
