package com.dev.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class EmailVerificationResendRequest {
    @NotBlank
    @Email
    @Size(max = 320)
    private String email;
}
