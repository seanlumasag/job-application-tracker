package com.dev.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class MfaCodeRequest {
    @NotBlank
    @Pattern(regexp = "\\d{6}")
    private String code;
}
