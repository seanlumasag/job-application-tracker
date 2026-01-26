package com.dev.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TokenDispatchResponse {
    private String message;
    private String token;
}
