package com.dev.backend.controller;

import com.dev.backend.dto.AuthRequest;
import com.dev.backend.dto.AuthResponse;
import com.dev.backend.dto.EmailVerificationRequest;
import com.dev.backend.dto.EmailVerificationResendRequest;
import com.dev.backend.dto.LogoutRequest;
import com.dev.backend.dto.MfaCodeRequest;
import com.dev.backend.dto.MfaSetupResponse;
import com.dev.backend.dto.PasswordResetConfirmRequest;
import com.dev.backend.dto.PasswordResetRequest;
import com.dev.backend.dto.TokenDispatchResponse;
import com.dev.backend.dto.TokenRefreshRequest;
import com.dev.backend.security.JwtAuthFilter;
import com.dev.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse signup(@Valid @RequestBody AuthRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody TokenRefreshRequest request) {
        return authService.refresh(request.getRefreshToken());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request.getRefreshToken());
    }

    @PostMapping("/verify-email")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void verifyEmail(@Valid @RequestBody EmailVerificationRequest request) {
        authService.verifyEmail(request.getToken());
    }

    @PostMapping("/verify-email/resend")
    public TokenDispatchResponse resendVerification(@Valid @RequestBody EmailVerificationResendRequest request) {
        String token = authService.requestEmailVerification(request.getEmail());
        return new TokenDispatchResponse("If the account exists, a verification email was sent.", token);
    }

    @PostMapping("/password/forgot")
    public TokenDispatchResponse requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        String token = authService.requestPasswordReset(request.getEmail());
        return new TokenDispatchResponse("If the account exists, a reset link was sent.", token);
    }

    @PostMapping("/password/reset")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@Valid @RequestBody PasswordResetConfirmRequest request) {
        authService.resetPassword(request.getToken(), request.getPassword());
    }

    @PostMapping("/mfa/setup")
    public MfaSetupResponse setupMfa(HttpServletRequest servletRequest) {
        Long userId = (Long) servletRequest.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return authService.setupMfa(userId);
    }

    @PostMapping("/mfa/enable")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void enableMfa(
            @Valid @RequestBody MfaCodeRequest request,
            HttpServletRequest servletRequest
    ) {
        Long userId = (Long) servletRequest.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        authService.enableMfa(userId, request.getCode());
    }

    @PostMapping("/mfa/disable")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disableMfa(
            @Valid @RequestBody MfaCodeRequest request,
            HttpServletRequest servletRequest
    ) {
        Long userId = (Long) servletRequest.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        authService.disableMfa(userId, request.getCode());
    }
}
