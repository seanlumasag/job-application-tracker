package com.dev.backend.repository;

import com.dev.backend.model.StageEvent;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StageEventRepository extends JpaRepository<StageEvent, Long> {
    Optional<StageEvent> findByIdAndApplicationUserId(Long id, Long userId);
    List<StageEvent> findAllByApplicationUserId(Long userId);
}
