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
}
