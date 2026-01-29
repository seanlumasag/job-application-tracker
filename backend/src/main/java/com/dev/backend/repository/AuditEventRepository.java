package com.dev.backend.repository;

import com.dev.backend.model.AuditEvent;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {
    Page<AuditEvent> findAllByUserId(UUID userId, Pageable pageable);

    void deleteAllByUserId(UUID userId);
}
