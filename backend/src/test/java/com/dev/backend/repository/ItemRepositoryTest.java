package com.dev.backend.repository;

import com.dev.backend.model.Item;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ItemRepositoryTest {

    @Autowired
    private ItemRepository itemRepository;

    @Test
    void saveSetsTimestamps() {
        Item item = new Item();
        item.setName("Timestamped");
        item.setDescription("Check timestamps");

        Item saved = itemRepository.saveAndFlush(item);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    void updateRefreshesUpdatedAt() {
        Item item = new Item();
        item.setName("Before");
        item.setDescription("First");
        Item saved = itemRepository.saveAndFlush(item);
        LocalDateTime createdAt = saved.getCreatedAt();
        LocalDateTime initialUpdatedAt = saved.getUpdatedAt();

        saved.setDescription("Second");
        Item updated = itemRepository.saveAndFlush(saved);

        assertThat(updated.getCreatedAt()).isEqualTo(createdAt);
        assertThat(updated.getUpdatedAt()).isAfterOrEqualTo(initialUpdatedAt);
    }
}
