package com.dev.backend.service;

import com.dev.backend.dto.AuthRequest;
import com.dev.backend.dto.AuthResponse;
import com.dev.backend.dto.MfaSetupResponse;
import com.dev.backend.model.EmailVerificationToken;
import com.dev.backend.model.PasswordResetToken;
import com.dev.backend.model.RefreshToken;
import com.dev.backend.model.User;
import com.dev.backend.repository.EmailVerificationTokenRepository;
import com.dev.backend.repository.PasswordResetTokenRepository;
import com.dev.backend.repository.RefreshTokenRepository;
import com.dev.backend.repository.UserRepository;
import com.dev.backend.repository.ApplicationRepository;
import com.dev.backend.repository.TaskRepository;
import com.dev.backend.repository.StageEventRepository;
import com.dev.backend.repository.AuditEventRepository;
import com.dev.backend.security.TotpService;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ApplicationRepository applicationRepository;
    private final TaskRepository taskRepository;
    private final StageEventRepository stageEventRepository;
    private final AuditEventRepository auditEventRepository;
    private final TotpService totpService;
    private final boolean requireEmailVerified;
    private final boolean returnTokens;
    private final long emailVerificationHours;
    private final long passwordResetMinutes;
    private final long refreshTokenDays;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            RefreshTokenRepository refreshTokenRepository,
            ApplicationRepository applicationRepository,
            TaskRepository taskRepository,
            StageEventRepository stageEventRepository,
            AuditEventRepository auditEventRepository,
            TotpService totpService,
            @Value("${app.auth.require-email-verified:false}") boolean requireEmailVerified,
            @Value("${app.auth.return-tokens:true}") boolean returnTokens,
            @Value("${app.auth.email-verification-expiration-hours:24}") long emailVerificationHours,
            @Value("${app.auth.password-reset-expiration-minutes:30}") long passwordResetMinutes,
            @Value("${app.auth.refresh-token-expiration-days:30}") long refreshTokenDays
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.applicationRepository = applicationRepository;
        this.taskRepository = taskRepository;
        this.stageEventRepository = stageEventRepository;
        this.auditEventRepository = auditEventRepository;
        this.totpService = totpService;
        this.requireEmailVerified = requireEmailVerified;
        this.returnTokens = returnTokens;
        this.emailVerificationHours = emailVerificationHours;
        this.passwordResetMinutes = passwordResetMinutes;
        this.refreshTokenDays = refreshTokenDays;
    }

    public AuthResponse signup(AuthRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        User saved = userRepository.save(user);
        createEmailVerificationToken(saved);
        return buildAuthResponse(saved, !requireEmailVerified);
    }

    public AuthResponse login(AuthRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        if (requireEmailVerified && !user.isEmailVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Email not verified");
        }

        if (user.isMfaEnabled()) {
            String code = request.getMfaCode();
            if (code == null || !totpService.verifyCode(user.getMfaSecret(), code)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid MFA code");
            }
        }

        return buildAuthResponse(user, true);
    }

    public AuthResponse refresh(String refreshToken) {
        RefreshToken stored = findValidRefreshToken(refreshToken);
        if (stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            revokeRefreshToken(stored);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expired");
        }

        User user = userRepository.findById(stored.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (requireEmailVerified && !user.isEmailVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Email not verified");
        }

        revokeRefreshToken(stored);
        return buildAuthResponse(user, true);
    }

    public void logout(String refreshToken) {
        RefreshToken stored = findValidRefreshToken(refreshToken);
        revokeRefreshToken(stored);
    }

    public String requestEmailVerification(String email) {
        String normalizedEmail = normalizeEmail(email);
        if (returnTokens) {
            return createEmailVerificationTokenForReturn(normalizedEmail);
        }
        userRepository.findByEmail(normalizedEmail).ifPresent(user -> {
            if (!user.isEmailVerified()) {
                createEmailVerificationToken(user);
            }
        });
        return null;
    }

    public void verifyEmail(String token) {
        EmailVerificationToken stored = emailVerificationTokenRepository.findByTokenHash(hashToken(token))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid token"));
        if (stored.getUsedAt() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token already used");
        }
        if (stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token expired");
        }

        User user = userRepository.findById(stored.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid token"));

        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        userRepository.save(user);

        stored.setUsedAt(LocalDateTime.now());
        emailVerificationTokenRepository.save(stored);
    }

    public String requestPasswordReset(String email) {
        String normalizedEmail = normalizeEmail(email);
        if (returnTokens) {
            return createPasswordResetTokenForReturn(normalizedEmail);
        }
        userRepository.findByEmail(normalizedEmail).ifPresent(this::createPasswordResetToken);
        return null;
    }

    public void resetPassword(String token, String newPassword) {
        PasswordResetToken stored = passwordResetTokenRepository.findByTokenHash(hashToken(token))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid token"));
        if (stored.getUsedAt() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token already used");
        }
        if (stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token expired");
        }

        User user = userRepository.findById(stored.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid token"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        stored.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(stored);
        refreshTokenRepository.deleteAllByUserId(user.getId());
    }

    public MfaSetupResponse setupMfa(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        String secret = totpService.generateSecret();
        user.setMfaSecret(secret);
        user.setMfaEnabled(false);
        userRepository.save(user);
        String otpauthUrl = totpService.buildOtpAuthUrl(user.getEmail(), secret);
        return new MfaSetupResponse(secret, otpauthUrl);
    }

    public void enableMfa(UUID userId, String code) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.getMfaSecret() == null || !totpService.verifyCode(user.getMfaSecret(), code)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid MFA code");
        }
        user.setMfaEnabled(true);
        userRepository.save(user);
    }

    public void disableMfa(UUID userId, String code) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.isMfaEnabled()) {
            if (user.getMfaSecret() == null || !totpService.verifyCode(user.getMfaSecret(), code)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid MFA code");
            }
        }
        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount(UUID userId, String password) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        refreshTokenRepository.deleteAllByUserId(userId);
        emailVerificationTokenRepository.deleteAllByUserId(userId);
        passwordResetTokenRepository.deleteAllByUserId(userId);
        taskRepository.deleteAllByApplicationUserId(userId);
        stageEventRepository.deleteAllByApplicationUserId(userId);
        applicationRepository.deleteAllByUserId(userId);
        auditEventRepository.deleteAllByUserId(userId);
        userRepository.deleteById(userId);
    }
    

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private AuthResponse buildAuthResponse(User user, boolean issueTokens) {
        String accessToken = null;
        String refreshToken = null;
        if (issueTokens) {
            accessToken = jwtService.generateToken(user);
            refreshToken = createRefreshToken(user);
        }
        return new AuthResponse(
                user.getId(),
                user.getEmail(),
                accessToken,
                refreshToken,
                user.isEmailVerified(),
                user.isMfaEnabled()
        );
    }

    private void createEmailVerificationToken(User user) {
        emailVerificationTokenRepository.deleteAllByUserId(user.getId());
        EmailVerificationToken token = new EmailVerificationToken();
        token.setUserId(user.getId());
        token.setTokenHash(hashToken(generateToken()));
        token.setExpiresAt(LocalDateTime.now().plusHours(emailVerificationHours));
        emailVerificationTokenRepository.save(token);
    }

    private String createEmailVerificationTokenForReturn(String normalizedEmail) {
        return userRepository.findByEmail(normalizedEmail).map(user -> {
            if (user.isEmailVerified()) {
                return null;
            }
            emailVerificationTokenRepository.deleteAllByUserId(user.getId());
            String raw = generateToken();
            EmailVerificationToken token = new EmailVerificationToken();
            token.setUserId(user.getId());
            token.setTokenHash(hashToken(raw));
            token.setExpiresAt(LocalDateTime.now().plusHours(emailVerificationHours));
            emailVerificationTokenRepository.save(token);
            return raw;
        }).orElse(null);
    }

    private void createPasswordResetToken(User user) {
        passwordResetTokenRepository.deleteAllByUserId(user.getId());
        PasswordResetToken token = new PasswordResetToken();
        token.setUserId(user.getId());
        token.setTokenHash(hashToken(generateToken()));
        token.setExpiresAt(LocalDateTime.now().plusMinutes(passwordResetMinutes));
        passwordResetTokenRepository.save(token);
    }

    private String createPasswordResetTokenForReturn(String normalizedEmail) {
        return userRepository.findByEmail(normalizedEmail).map(user -> {
            passwordResetTokenRepository.deleteAllByUserId(user.getId());
            String raw = generateToken();
            PasswordResetToken token = new PasswordResetToken();
            token.setUserId(user.getId());
            token.setTokenHash(hashToken(raw));
            token.setExpiresAt(LocalDateTime.now().plusMinutes(passwordResetMinutes));
            passwordResetTokenRepository.save(token);
            return raw;
        }).orElse(null);
    }

    private String createRefreshToken(User user) {
        String raw = generateToken();
        RefreshToken token = new RefreshToken();
        token.setUserId(user.getId());
        token.setTokenHash(hashToken(raw));
        token.setExpiresAt(LocalDateTime.now().plusDays(refreshTokenDays));
        refreshTokenRepository.save(token);
        return raw;
    }

    private RefreshToken findValidRefreshToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token required");
        }
        return refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(hashToken(rawToken))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));
    }

    private void revokeRefreshToken(RefreshToken token) {
        token.setRevokedAt(LocalDateTime.now());
        refreshTokenRepository.save(token);
    }

    private String generateToken() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to hash token", ex);
        }
    }
}
