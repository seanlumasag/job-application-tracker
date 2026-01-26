package com.dev.backend.security;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.time.Instant;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.apache.commons.codec.binary.Base32;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TotpService {

    private static final int SECRET_BYTES = 20;
    private static final int OTP_DIGITS = 6;
    private static final int TIME_STEP_SECONDS = 30;
    private static final int WINDOW_STEPS = 1;

    private final SecureRandom secureRandom = new SecureRandom();
    private final Base32 base32 = new Base32();
    private final String issuer;

    public TotpService(@Value("${app.mfa.issuer:JobTracker}") String issuer) {
        this.issuer = issuer;
    }

    public String generateSecret() {
        byte[] bytes = new byte[SECRET_BYTES];
        secureRandom.nextBytes(bytes);
        return base32.encodeToString(bytes).replace("=", "");
    }

    public boolean verifyCode(String secret, String code) {
        if (secret == null || code == null || !code.matches("\\d{6}")) {
            return false;
        }
        long nowStep = Instant.now().getEpochSecond() / TIME_STEP_SECONDS;
        for (long offset = -WINDOW_STEPS; offset <= WINDOW_STEPS; offset++) {
            String expected = totpAtStep(secret, nowStep + offset);
            if (expected.equals(code)) {
                return true;
            }
        }
        return false;
    }

    public String buildOtpAuthUrl(String email, String secret) {
        String label = urlEncode(issuer + ":" + email);
        String encodedIssuer = urlEncode(issuer);
        return "otpauth://totp/" + label
                + "?secret=" + secret
                + "&issuer=" + encodedIssuer
                + "&digits=" + OTP_DIGITS
                + "&period=" + TIME_STEP_SECONDS;
    }

    private String totpAtStep(String secret, long step) {
        byte[] key = base32.decode(secret);
        byte[] counter = ByteBuffer.allocate(8).putLong(step).array();
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(counter);
            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);
            int otp = binary % (int) Math.pow(10, OTP_DIGITS);
            return String.format("%0" + OTP_DIGITS + "d", otp);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Unable to generate TOTP", e);
        }
    }

    private String urlEncode(String value) {
        return java.net.URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
