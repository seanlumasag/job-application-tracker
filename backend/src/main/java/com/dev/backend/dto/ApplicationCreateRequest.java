package com.dev.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ApplicationCreateRequest {
    @NotBlank
    @Size(max = 255)
    private String company;

    @NotBlank
    @Size(max = 255)
    private String role;

    @Size(max = 2048)
    private String jobUrl;

    @Size(max = 255)
    private String location;

    @Size(max = 2000)
    private String notes;
}
