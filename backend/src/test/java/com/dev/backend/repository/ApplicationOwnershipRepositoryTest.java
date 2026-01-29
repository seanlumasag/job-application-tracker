package com.dev.backend.repository;

import com.dev.backend.model.Application;
import com.dev.backend.model.Stage;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@TestPropertySource(properties = "spring.sql.init.mode=never")
class ApplicationOwnershipRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Test
    void findByIdAndUserIdBlocksOtherUsers() {
        UUID ownerId = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();

        Application ownerApp = new Application();
        ownerApp.setCompany("Acme");
        ownerApp.setRole("Engineer");
        ownerApp.setStage(Stage.SAVED);
        ownerApp.setUserId(ownerId);
        entityManager.persist(ownerApp);

        entityManager.flush();

        assertThat(applicationRepository.findByIdAndUserId(ownerApp.getId(), otherId)).isEmpty();
        assertThat(applicationRepository.findByIdAndUserId(ownerApp.getId(), ownerId)).isPresent();
    }

    @Test
    void findAllByUserIdReturnsOnlyOwnedRows() {
        UUID ownerId = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();

        Application ownerApp = new Application();
        ownerApp.setCompany("OwnerCo");
        ownerApp.setRole("Engineer");
        ownerApp.setUserId(ownerId);
        entityManager.persist(ownerApp);

        Application otherApp = new Application();
        otherApp.setCompany("OtherCo");
        otherApp.setRole("Analyst");
        otherApp.setUserId(otherId);
        entityManager.persist(otherApp);

        entityManager.flush();

        assertThat(applicationRepository.findAllByUserId(ownerId))
                .extracting(Application::getId)
                .containsExactly(ownerApp.getId());
    }
}
