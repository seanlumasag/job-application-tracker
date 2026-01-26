package com.dev.backend.repository;

import com.dev.backend.model.RefreshToken;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenHashAndRevokedAtIsNull(String tokenHash);
    long deleteAllByUserId(Long userId);
    long deleteAllByExpiresAtBefore(LocalDateTime cutoff);
}
