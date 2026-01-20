package com.dev.backend.service;

import com.dev.backend.model.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final Key signingKey;
    private final long expirationSeconds;

    public JwtService(
            @Value("${jwt.secret:dev-secret-change-me-please-change-32chars}") String secret,
            @Value("${jwt.expiration-seconds:86400}") long expirationSeconds
    ) {
        this.signingKey = Keys.hmacShaKeyFor(normalizeSecret(secret));
        this.expirationSeconds = expirationSeconds;
    }

    public String generateToken(User user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(expirationSeconds);

        return Jwts.builder()
                .setSubject(String.valueOf(user.getId()))
                .claim("email", user.getEmail())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiresAt))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    private byte[] normalizeSecret(String secret) {
        String trimmed = secret == null ? "" : secret.trim();
        if (trimmed.isEmpty()) {
            trimmed = "dev-secret-change-me-please-change-32chars";
        }
        byte[] bytes = trimmed.getBytes(StandardCharsets.UTF_8);
        if (bytes.length >= 32) {
            return bytes;
        }
        String padded = trimmed + "00000000000000000000000000000000";
        return padded.getBytes(StandardCharsets.UTF_8);
    }
}
