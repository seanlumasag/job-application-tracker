package com.dev.backend.repository;

import com.dev.backend.model.Application;
import com.dev.backend.model.Stage;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    Optional<Application> findByIdAndUserId(Long id, UUID userId);
    List<Application> findAllByUserId(UUID userId);
    List<Application> findAllByUserId(UUID userId, Sort sort);
    List<Application> findAllByUserIdAndStage(UUID userId, Stage stage, Sort sort);
    List<Application> findAllByUserIdAndLastTouchAtBefore(UUID userId, LocalDateTime cutoff, Sort sort);
    List<Application> findAllByUserIdAndLastTouchAtBeforeAndStageNotIn(
            UUID userId,
            LocalDateTime cutoff,
            List<Stage> stages,
            Sort sort
    );

    @Query("select a.stage as stage, count(a) as total from Application a where a.userId = :userId group by a.stage")
    List<StageCount> countByStage(@Param("userId") UUID userId);

    void deleteAllByUserId(UUID userId);

    interface StageCount {
        Stage getStage();
        long getTotal();
    }
}
