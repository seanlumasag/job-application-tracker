package com.dev.backend.controller;

import com.dev.backend.model.Item;
import com.dev.backend.service.ItemService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ItemController.class)
class ItemControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ItemService itemService;

    @Test
    void getAllItemsReturnsList() throws Exception {
        Item item = new Item(1L, "Alpha", "First", LocalDateTime.now(), LocalDateTime.now());
        given(itemService.getAllItems()).willReturn(List.of(item));

        mockMvc.perform(get("/api/items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Alpha"))
                .andExpect(jsonPath("$[0].description").value("First"));
    }

    @Test
    void getItemByIdReturnsItemWhenFound() throws Exception {
        Item item = new Item(2L, "Beta", "Second", LocalDateTime.now(), LocalDateTime.now());
        given(itemService.getItemById(2L)).willReturn(Optional.of(item));

        mockMvc.perform(get("/api/items/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.name").value("Beta"));
    }

    @Test
    void getItemByIdReturnsNotFoundWhenMissing() throws Exception {
        given(itemService.getItemById(404L)).willReturn(Optional.empty());

        mockMvc.perform(get("/api/items/404"))
                .andExpect(status().isNotFound());
    }

    @Test
    void createItemReturnsCreatedItem() throws Exception {
        Item request = new Item(null, "Gamma", "Third", null, null);
        Item created = new Item(3L, "Gamma", "Third", LocalDateTime.now(), LocalDateTime.now());
        given(itemService.createItem(any(Item.class))).willReturn(created);

        mockMvc.perform(post("/api/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.name").value("Gamma"));
    }

    @Test
    void updateItemReturnsUpdatedItem() throws Exception {
        Item request = new Item(null, "Delta", "Updated", null, null);
        Item updated = new Item(4L, "Delta", "Updated", LocalDateTime.now(), LocalDateTime.now());
        given(itemService.updateItem(eq(4L), any(Item.class))).willReturn(updated);

        mockMvc.perform(put("/api/items/4")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(4))
                .andExpect(jsonPath("$.description").value("Updated"));
    }

    @Test
    void updateItemReturnsNotFoundWhenMissing() throws Exception {
        doThrow(new RuntimeException("not found")).when(itemService).updateItem(eq(9L), any(Item.class));

        mockMvc.perform(put("/api/items/9")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new Item())))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteItemReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/items/7"))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteItemReturnsNotFoundWhenMissing() throws Exception {
        doThrow(new RuntimeException("not found")).when(itemService).deleteItem(11L);

        mockMvc.perform(delete("/api/items/11"))
                .andExpect(status().isNotFound());
    }
}
