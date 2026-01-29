package com.dev.backend.repository;

import com.dev.backend.model.StageEvent;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StageEventRepository extends JpaRepository<StageEvent, Long> {
    Optional<StageEvent> findByIdAndApplicationUserId(Long id, UUID userId);
    List<StageEvent> findAllByApplicationUserId(UUID userId);
    List<StageEvent> findAllByApplicationUserIdAndCreatedAtBetween(
            UUID userId,
            java.time.LocalDateTime start,
            java.time.LocalDateTime end
    );

    List<StageEvent> findAllByApplicationIdAndApplicationUserIdOrderByCreatedAtDesc(
            Long applicationId,
            UUID userId
    );

    void deleteAllByApplicationIdAndApplicationUserId(Long applicationId, UUID userId);
}
