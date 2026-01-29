package com.dev.backend.repository;

import com.dev.backend.model.Application;
import com.dev.backend.model.Stage;
import com.dev.backend.model.StageEvent;
import java.util.UUID;
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
        UUID ownerId = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();

        Application ownerApp = new Application();
        ownerApp.setCompany("Acme");
        ownerApp.setRole("Engineer");
        ownerApp.setUserId(ownerId);
        entityManager.persist(ownerApp);

        StageEvent event = new StageEvent();
        event.setApplication(ownerApp);
        event.setFromStage(Stage.SAVED);
        event.setToStage(Stage.APPLIED);
        entityManager.persist(event);

        entityManager.flush();

        assertThat(stageEventRepository.findByIdAndApplicationUserId(event.getId(), otherId)).isEmpty();
        assertThat(stageEventRepository.findByIdAndApplicationUserId(event.getId(), ownerId)).isPresent();
    }

    @Test
    void findAllByApplicationUserIdReturnsOnlyOwnedRows() {
        UUID ownerId = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();

        Application ownerApp = new Application();
        ownerApp.setCompany("OwnerCo");
        ownerApp.setRole("Engineer");
        ownerApp.setUserId(ownerId);
        entityManager.persist(ownerApp);

        StageEvent ownerEvent = new StageEvent();
        ownerEvent.setApplication(ownerApp);
        ownerEvent.setFromStage(Stage.SAVED);
        ownerEvent.setToStage(Stage.APPLIED);
        entityManager.persist(ownerEvent);

        Application otherApp = new Application();
        otherApp.setCompany("OtherCo");
        otherApp.setRole("Analyst");
        otherApp.setUserId(otherId);
        entityManager.persist(otherApp);

        StageEvent otherEvent = new StageEvent();
        otherEvent.setApplication(otherApp);
        otherEvent.setFromStage(Stage.SAVED);
        otherEvent.setToStage(Stage.APPLIED);
        entityManager.persist(otherEvent);

        entityManager.flush();

        assertThat(stageEventRepository.findAllByApplicationUserId(ownerId))
                .extracting(StageEvent::getId)
                .containsExactly(ownerEvent.getId());
    }
}
