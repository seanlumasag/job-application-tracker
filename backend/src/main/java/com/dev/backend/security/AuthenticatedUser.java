package com.dev.backend.security;

import java.util.UUID;

public class AuthenticatedUser {

    private final UUID id;
    private final String email;

    public AuthenticatedUser(UUID id, String email) {
        this.id = id;
        this.email = email;
    }

    public UUID getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }
}
