package com.dev.backend.repository;

import com.dev.backend.model.Application;
import com.dev.backend.model.Stage;
import com.dev.backend.model.StageEvent;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class StageEventRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void persistSetsCreatedAtAndLinksApplication() {
        Application application = new Application();
        application.setCompany("Acme");
        application.setRole("Engineer");
        application = entityManager.persistFlushFind(application);

        StageEvent event = new StageEvent();
        event.setApplication(application);
        event.setFromStage(Stage.SAVED);
        event.setToStage(Stage.APPLIED);
        event.setActor("system");
        event.setNote("Initial move");

        StageEvent saved = entityManager.persistFlushFind(event);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getApplication().getId()).isEqualTo(application.getId());
        assertThat(saved.getFromStage()).isEqualTo(Stage.SAVED);
        assertThat(saved.getToStage()).isEqualTo(Stage.APPLIED);
    }
}
