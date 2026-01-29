package com.dev.backend.repository;

import com.dev.backend.model.Application;
import com.dev.backend.model.Task;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@TestPropertySource(properties = "spring.sql.init.mode=never")
class TaskOwnershipRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private TaskRepository taskRepository;

    @Test
    void findByIdAndApplicationUserIdBlocksOtherUsers() {
        UUID ownerId = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();

        Application ownerApp = new Application();
        ownerApp.setCompany("Acme");
        ownerApp.setRole("Engineer");
        ownerApp.setUserId(ownerId);
        entityManager.persist(ownerApp);

        Task task = new Task();
        task.setApplication(ownerApp);
        task.setTitle("Follow up");
        entityManager.persist(task);

        entityManager.flush();

        assertThat(taskRepository.findByIdAndApplicationUserId(task.getId(), otherId)).isEmpty();
        assertThat(taskRepository.findByIdAndApplicationUserId(task.getId(), ownerId)).isPresent();
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

        Task ownerTask = new Task();
        ownerTask.setApplication(ownerApp);
        ownerTask.setTitle("Owner Task");
        entityManager.persist(ownerTask);

        Application otherApp = new Application();
        otherApp.setCompany("OtherCo");
        otherApp.setRole("Analyst");
        otherApp.setUserId(otherId);
        entityManager.persist(otherApp);

        Task otherTask = new Task();
        otherTask.setApplication(otherApp);
        otherTask.setTitle("Other Task");
        entityManager.persist(otherTask);

        entityManager.flush();

        assertThat(taskRepository.findAllByApplicationUserId(ownerId))
                .extracting(Task::getId)
                .containsExactly(ownerTask.getId());
    }
}
