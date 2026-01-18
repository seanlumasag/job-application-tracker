package com.dev.backend.repository;

import com.dev.backend.model.Application;
import com.dev.backend.model.Task;
import com.dev.backend.model.TaskStatus;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class TaskRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void persistSetsDefaultsAndTimestamps() {
        Application application = new Application();
        application.setCompany("Acme");
        application.setRole("Engineer");
        application = entityManager.persistFlushFind(application);

        Task task = new Task();
        task.setApplication(application);
        task.setTitle("Follow up");
        task.setDueAt(LocalDateTime.now().plusDays(2));

        Task saved = entityManager.persistFlushFind(task);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getStatus()).isEqualTo(TaskStatus.OPEN);
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
        assertThat(saved.getApplication().getId()).isEqualTo(application.getId());
    }

    @Test
    void updateRefreshesUpdatedAt() {
        Application application = new Application();
        application.setCompany("Beta");
        application.setRole("Analyst");
        application = entityManager.persistFlushFind(application);

        Task task = new Task();
        task.setApplication(application);
        task.setTitle("Send resume");
        task = entityManager.persistFlushFind(task);
        LocalDateTime initialUpdatedAt = task.getUpdatedAt();

        task.setStatus(TaskStatus.DONE);
        Task updated = entityManager.persistFlushFind(task);

        assertThat(updated.getUpdatedAt()).isAfterOrEqualTo(initialUpdatedAt);
        assertThat(updated.getStatus()).isEqualTo(TaskStatus.DONE);
    }
}
