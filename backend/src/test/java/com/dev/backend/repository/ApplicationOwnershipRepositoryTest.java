package com.dev.backend.repository;

import com.dev.backend.model.Application;
import com.dev.backend.model.Stage;
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
        Application ownerApp = new Application();
        ownerApp.setCompany("Acme");
        ownerApp.setRole("Engineer");
        ownerApp.setStage(Stage.SAVED);
        ownerApp.setUserId(100L);
        entityManager.persist(ownerApp);

        entityManager.flush();

        assertThat(applicationRepository.findByIdAndUserId(ownerApp.getId(), 200L)).isEmpty();
        assertThat(applicationRepository.findByIdAndUserId(ownerApp.getId(), 100L)).isPresent();
    }
}
