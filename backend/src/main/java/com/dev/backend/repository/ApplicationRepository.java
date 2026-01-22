package com.dev.backend.repository;

import com.dev.backend.model.Application;
import com.dev.backend.model.Stage;
import java.util.List;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    Optional<Application> findByIdAndUserId(Long id, Long userId);
    List<Application> findAllByUserId(Long userId);
    List<Application> findAllByUserId(Long userId, Sort sort);
    List<Application> findAllByUserIdAndStage(Long userId, Stage stage, Sort sort);
    List<Application> findAllByUserIdAndLastTouchAtBefore(Long userId, LocalDateTime cutoff, Sort sort);
    List<Application> findAllByUserIdAndLastTouchAtBeforeAndStageNotIn(
            Long userId,
            LocalDateTime cutoff,
            List<Stage> stages,
            Sort sort
    );

    @Query("select a.stage as stage, count(a) as total from Application a where a.userId = :userId group by a.stage")
    List<StageCount> countByStage(@Param("userId") Long userId);

    interface StageCount {
        Stage getStage();
        long getTotal();
    }
}
