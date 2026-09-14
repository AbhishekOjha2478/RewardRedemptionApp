package com.ces.rewards.service;

import com.ces.rewards.config.JwtProperties;
import com.ces.rewards.entity.CesUser;
import com.ces.rewards.entity.RefreshToken;
import com.ces.rewards.exception.ApiException;
import com.ces.rewards.repository.RefreshTokenRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.temporal.ChronoUnit;
import java.util.Base64;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final Clock clock;
    private final long refreshTokenDays;
    private final SecureRandom random = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
                               JwtProperties jwtProperties,
                               Clock clock) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.clock = clock;
        this.refreshTokenDays = jwtProperties.refreshTokenDays();
    }

    @Transactional
    public String issue(CesUser user) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        RefreshToken token = new RefreshToken();
        token.setCesUser(user);
        token.setTokenHash(hash(rawToken));
        token.setExpiresAt(clock.instant().plus(refreshTokenDays, ChronoUnit.DAYS));
        token.setRevoked(false);
        refreshTokenRepository.save(token);

        return rawToken;
    }

    @Transactional
    public CesUser consume(String rawToken) {
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token is not valid"));

        if (stored.isRevoked()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token has already been used");
        }
        if (stored.getExpiresAt().isBefore(clock.instant())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token has expired");
        }

        stored.setRevoked(true);
        return stored.getCesUser();
    }

    @Transactional
    public void revokeAllForUser(Long userId) {
        refreshTokenRepository.revokeAllForUser(userId);
    }

    @Transactional
    public void revokeSingle(String rawToken) {
        refreshTokenRepository.findByTokenHash(hash(rawToken)).ifPresent(token -> token.setRevoked(true));
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashed);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }
}
