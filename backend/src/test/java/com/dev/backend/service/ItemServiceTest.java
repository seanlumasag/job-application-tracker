package com.dev.backend.service;

import com.dev.backend.model.Item;
import com.dev.backend.repository.ItemRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ItemServiceTest {

    @Mock
    private ItemRepository itemRepository;

    @InjectMocks
    private ItemService itemService;

    @Test
    void getAllItemsReturnsRepositoryItems() {
        Item item = new Item(1L, "One", "First", LocalDateTime.now(), LocalDateTime.now());
        given(itemRepository.findAll()).willReturn(List.of(item));

        List<Item> result = itemService.getAllItems();

        assertThat(result).hasSize(1).first().extracting(Item::getName).isEqualTo("One");
    }

    @Test
    void getItemByIdReturnsOptional() {
        Item item = new Item(2L, "Two", "Second", LocalDateTime.now(), LocalDateTime.now());
        given(itemRepository.findById(2L)).willReturn(Optional.of(item));

        Optional<Item> result = itemService.getItemById(2L);

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Two");
    }

    @Test
    void createItemSavesEntity() {
        Item request = new Item(null, "Create", "New", null, null);
        Item saved = new Item(3L, "Create", "New", LocalDateTime.now(), LocalDateTime.now());
        given(itemRepository.save(any(Item.class))).willReturn(saved);

        Item result = itemService.createItem(request);

        assertThat(result.getId()).isEqualTo(3L);
        verify(itemRepository).save(request);
    }

    @Test
    void updateItemUpdatesFields() {
        Item existing = new Item(4L, "Old", "Old desc", LocalDateTime.now(), LocalDateTime.now());
        Item update = new Item(null, "New", "New desc", null, null);
        given(itemRepository.findById(4L)).willReturn(Optional.of(existing));
        given(itemRepository.save(any(Item.class))).willReturn(existing);

        Item result = itemService.updateItem(4L, update);

        ArgumentCaptor<Item> captor = ArgumentCaptor.forClass(Item.class);
        verify(itemRepository).save(captor.capture());
        Item saved = captor.getValue();
        assertThat(saved.getName()).isEqualTo("New");
        assertThat(saved.getDescription()).isEqualTo("New desc");
        assertThat(result.getName()).isEqualTo("New");
    }

    @Test
    void updateItemThrowsWhenMissing() {
        given(itemRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> itemService.updateItem(99L, new Item()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Item not found");
    }

    @Test
    void deleteItemRemovesEntity() {
        Item existing = new Item(5L, "Delete", "Gone", LocalDateTime.now(), LocalDateTime.now());
        given(itemRepository.findById(5L)).willReturn(Optional.of(existing));

        itemService.deleteItem(5L);

        verify(itemRepository).delete(existing);
    }

    @Test
    void deleteItemThrowsWhenMissing() {
        given(itemRepository.findById(100L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> itemService.deleteItem(100L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Item not found");
    }
}
