package com.dev.backend.repository;

import com.dev.backend.model.Application;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ApplicationRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void persistSetsTimestamps() {
        Application application = new Application();
        application.setCompany("Acme");
        application.setRole("Engineer");

        Application saved = entityManager.persistFlushFind(application);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
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
    }
}
