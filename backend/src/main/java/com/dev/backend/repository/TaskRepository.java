package com.dev.backend.repository;

import com.dev.backend.model.Task;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;

public interface TaskRepository extends JpaRepository<Task, Long> {
    Optional<Task> findByIdAndApplicationUserId(Long id, Long userId);
    List<Task> findAllByApplicationUserId(Long userId);
    List<Task> findAllByApplicationId(Long applicationId, Sort sort);
    List<Task> findAllByApplicationUserIdAndStatusAndDueAtGreaterThanEqualAndDueAtLessThan(
            Long userId,
            com.dev.backend.model.TaskStatus status,
            java.time.LocalDateTime start,
            java.time.LocalDateTime end,
            Sort sort
    );
    List<Task> findAllByApplicationUserIdAndStatusAndDueAtLessThan(
            Long userId,
            com.dev.backend.model.TaskStatus status,
            java.time.LocalDateTime before,
            Sort sort
    );
}
