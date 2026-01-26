package com.dev.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private Long userId;
    private String email;
    private String token;
    private String refreshToken;
    private boolean emailVerified;
    private boolean mfaEnabled;
}
