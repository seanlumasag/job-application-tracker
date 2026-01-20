package com.dev.backend.repository;

import com.dev.backend.model.Application;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    Optional<Application> findByIdAndUserId(Long id, Long userId);
    List<Application> findAllByUserId(Long userId);
}
