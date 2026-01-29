package com.dev.backend.repository;

import com.dev.backend.model.Application;
import com.dev.backend.model.Stage;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Sort;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ApplicationRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Test
    void persistSetsDefaultsAndTimestamps() {
        Application application = new Application();
        application.setCompany("Acme");
        application.setRole("Engineer");

        Application saved = entityManager.persistFlushFind(application);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
        assertThat(saved.getStage()).isEqualTo(Stage.SAVED);
        assertThat(saved.getLastTouchAt()).isNotNull();
    }

    @Test
    void updateRefreshesUpdatedAt() {
        Application application = new Application();
        application.setCompany("Old Co");
        application.setRole("Dev");
        Application saved = entityManager.persistFlushFind(application);
        LocalDateTime createdAt = saved.getCreatedAt();
        LocalDateTime initialUpdatedAt = saved.getUpdatedAt();

        saved.setNotes("Updated");
        Application updated = entityManager.persistFlushFind(saved);

        assertThat(updated.getCreatedAt()).isEqualTo(createdAt);
        assertThat(updated.getUpdatedAt()).isAfterOrEqualTo(initialUpdatedAt);
        assertThat(updated.getLastTouchAt()).isNotNull();
    }

    @Test
    void findAllByUserIdAndStageRespectsSort() {
        UUID userId = UUID.randomUUID();
        Application oldSaved = new Application();
        oldSaved.setCompany("Old");
        oldSaved.setRole("Dev");
        oldSaved.setStage(Stage.SAVED);
        oldSaved.setUserId(userId);
        oldSaved.setLastTouchAt(LocalDateTime.now().minusDays(10));
        entityManager.persist(oldSaved);

        Application newSaved = new Application();
        newSaved.setCompany("New");
        newSaved.setRole("Dev");
        newSaved.setStage(Stage.SAVED);
        newSaved.setUserId(userId);
        newSaved.setLastTouchAt(LocalDateTime.now().minusDays(2));
        entityManager.persist(newSaved);

        Application otherStage = new Application();
        otherStage.setCompany("Applied");
        otherStage.setRole("Dev");
        otherStage.setStage(Stage.APPLIED);
        otherStage.setUserId(userId);
        entityManager.persist(otherStage);

        entityManager.flush();

        List<Application> results = applicationRepository.findAllByUserIdAndStage(
                userId,
                Stage.SAVED,
                Sort.by(Sort.Direction.DESC, "lastTouchAt")
        );

        assertThat(results).hasSize(2);
        assertThat(results.get(0).getId()).isEqualTo(newSaved.getId());
        assertThat(results.get(1).getId()).isEqualTo(oldSaved.getId());
    }

    @Test
    void findAllByUserIdAndLastTouchAtBeforeFiltersByCutoff() {
        UUID userId = UUID.randomUUID();
        Application stale = new Application();
        stale.setCompany("Stale");
        stale.setRole("Dev");
        stale.setUserId(userId);
        stale.setLastTouchAt(LocalDateTime.now().minusDays(45));
        entityManager.persist(stale);

        Application fresh = new Application();
        fresh.setCompany("Fresh");
        fresh.setRole("Dev");
        fresh.setUserId(userId);
        fresh.setLastTouchAt(LocalDateTime.now().minusDays(5));
        entityManager.persist(fresh);

        entityManager.flush();

        List<Application> results = applicationRepository.findAllByUserIdAndLastTouchAtBefore(
                userId,
                LocalDateTime.now().minusDays(30),
                Sort.by(Sort.Direction.ASC, "lastTouchAt")
        );

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getId()).isEqualTo(stale.getId());
    }
}
