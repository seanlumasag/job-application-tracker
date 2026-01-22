package com.dev.backend.dto;

import com.dev.backend.model.Stage;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApplicationStageUpdateRequest {
    @NotNull
    private Stage stage;
}
