package com.dev.backend.repository;

import com.dev.backend.model.Task;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, Long> {
    Optional<Task> findByIdAndApplicationUserId(Long id, Long userId);
    List<Task> findAllByApplicationUserId(Long userId);
}
