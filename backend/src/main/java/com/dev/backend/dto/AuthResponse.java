package com.dev.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.UUID;

@Data
@AllArgsConstructor
public class AuthResponse {
    private UUID userId;
    private String email;
    private String token;
    private String refreshToken;
    private boolean emailVerified;
    private boolean mfaEnabled;
}
