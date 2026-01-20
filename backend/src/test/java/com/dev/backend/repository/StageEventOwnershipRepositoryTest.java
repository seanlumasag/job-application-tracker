package com.dev.backend.repository;

import com.dev.backend.model.Application;
import com.dev.backend.model.Stage;
import com.dev.backend.model.StageEvent;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@TestPropertySource(properties = "spring.sql.init.mode=never")
class StageEventOwnershipRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private StageEventRepository stageEventRepository;

    @Test
    void findByIdAndApplicationUserIdBlocksOtherUsers() {
        Application ownerApp = new Application();
        ownerApp.setCompany("Acme");
        ownerApp.setRole("Engineer");
        ownerApp.setUserId(500L);
        entityManager.persist(ownerApp);

        StageEvent event = new StageEvent();
        event.setApplication(ownerApp);
        event.setFromStage(Stage.SAVED);
        event.setToStage(Stage.APPLIED);
        entityManager.persist(event);

        entityManager.flush();

        assertThat(stageEventRepository.findByIdAndApplicationUserId(event.getId(), 600L)).isEmpty();
        assertThat(stageEventRepository.findByIdAndApplicationUserId(event.getId(), 500L)).isPresent();
    }
}
