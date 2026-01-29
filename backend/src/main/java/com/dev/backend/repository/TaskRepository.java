package com.dev.backend.repository;

import com.dev.backend.model.Task;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, Long> {
    Optional<Task> findByIdAndApplicationUserId(Long id, UUID userId);
    List<Task> findAllByApplicationUserId(UUID userId);
    List<Task> findAllByApplicationId(Long applicationId, Sort sort);
    List<Task> findAllByApplicationUserIdAndStatusAndDueAtGreaterThanEqualAndDueAtLessThan(
            UUID userId,
            com.dev.backend.model.TaskStatus status,
            java.time.LocalDateTime start,
            java.time.LocalDateTime end,
            Sort sort
    );
    List<Task> findAllByApplicationUserIdAndStatusAndDueAtLessThan(
            UUID userId,
            com.dev.backend.model.TaskStatus status,
            java.time.LocalDateTime before,
            Sort sort
    );

    @Query("""
            select t from Task t
            where t.application.userId = :userId
              and t.status = com.dev.backend.model.TaskStatus.OPEN
              and t.dueAt >= :start
              and t.dueAt < :end
              and (t.snoozeUntil is null or t.snoozeUntil <= :now)
            order by t.dueAt asc
            """)
    List<Task> findDueSoon(
            @Param("userId") UUID userId,
            @Param("start") java.time.LocalDateTime start,
            @Param("end") java.time.LocalDateTime end,
            @Param("now") java.time.LocalDateTime now
    );

    @Query("""
            select count(t) from Task t
            where t.application.userId = :userId
              and t.status = com.dev.backend.model.TaskStatus.OPEN
              and t.dueAt < :before
              and (t.snoozeUntil is null or t.snoozeUntil <= :now)
            """)
    long countOverdue(
            @Param("userId") UUID userId,
            @Param("before") java.time.LocalDateTime before,
            @Param("now") java.time.LocalDateTime now
    );

    List<Task> findAllByApplicationUserIdAndCompletedAtBetween(
            UUID userId,
            java.time.LocalDateTime start,
            java.time.LocalDateTime end
    );

    void deleteAllByApplicationIdAndApplicationUserId(Long applicationId, UUID userId);
}
