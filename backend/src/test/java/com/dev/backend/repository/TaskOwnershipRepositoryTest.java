package com.dev.backend.repository;

import com.dev.backend.model.Application;
import com.dev.backend.model.Task;
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
        Application ownerApp = new Application();
        ownerApp.setCompany("Acme");
        ownerApp.setRole("Engineer");
        ownerApp.setUserId(300L);
        entityManager.persist(ownerApp);

        Task task = new Task();
        task.setApplication(ownerApp);
        task.setTitle("Follow up");
        entityManager.persist(task);

        entityManager.flush();

        assertThat(taskRepository.findByIdAndApplicationUserId(task.getId(), 400L)).isEmpty();
        assertThat(taskRepository.findByIdAndApplicationUserId(task.getId(), 300L)).isPresent();
    }

    @Test
    void findAllByApplicationUserIdReturnsOnlyOwnedRows() {
        Application ownerApp = new Application();
        ownerApp.setCompany("OwnerCo");
        ownerApp.setRole("Engineer");
        ownerApp.setUserId(301L);
        entityManager.persist(ownerApp);

        Task ownerTask = new Task();
        ownerTask.setApplication(ownerApp);
        ownerTask.setTitle("Owner Task");
        entityManager.persist(ownerTask);

        Application otherApp = new Application();
        otherApp.setCompany("OtherCo");
        otherApp.setRole("Analyst");
        otherApp.setUserId(302L);
        entityManager.persist(otherApp);

        Task otherTask = new Task();
        otherTask.setApplication(otherApp);
        otherTask.setTitle("Other Task");
        entityManager.persist(otherTask);

        entityManager.flush();

        assertThat(taskRepository.findAllByApplicationUserId(301L))
                .extracting(Task::getId)
                .containsExactly(ownerTask.getId());
    }
}
