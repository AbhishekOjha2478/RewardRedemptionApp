package com.ces.rewards.service;

import com.ces.rewards.dto.request.ChangePasswordRequest;
import com.ces.rewards.dto.request.LoginRequest;
import com.ces.rewards.dto.response.AuthUserResponse;
import com.ces.rewards.dto.response.LoginResponse;
import com.ces.rewards.entity.CesUser;
import com.ces.rewards.exception.ApiException;
import com.ces.rewards.repository.CesUserRepository;
import com.ces.rewards.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final CesUserRepository cesUserRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AuthenticationManager authenticationManager,
                       CesUserRepository cesUserRepository,
                       JwtService jwtService,
                       RefreshTokenService refreshTokenService,
                       PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.cesUserRepository = cesUserRepository;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));

        CesUser user = cesUserRepository.findByUsername(request.username())
                .orElseThrow(() -> ApiException.notFound("User"));

        return buildResponse(user);
    }

    @Transactional
    public LoginResponse refresh(String rawRefreshToken) {
        CesUser user = refreshTokenService.consume(rawRefreshToken);
        if (!user.isActive()) {
            throw ApiException.forbidden("This account has been deactivated");
        }
        return buildResponse(user);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        refreshTokenService.revokeSingle(rawRefreshToken);
    }

    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        CesUser user = cesUserRepository.findByUsername(username)
                .orElseThrow(() -> ApiException.notFound("User"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw ApiException.badRequest("Current password is incorrect");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw ApiException.badRequest("New password must be different from the current one");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        refreshTokenService.revokeAllForUser(user.getId());
    }

    public AuthUserResponse toAuthUser(CesUser user) {
        return new AuthUserResponse(user.getId(), user.getUsername(), user.getFullName(), user.getRole().name());
    }

    private LoginResponse buildResponse(CesUser user) {
        String accessToken = jwtService.generateAccessToken(
                user.getId(), user.getUsername(), user.getRole().name());
        String refreshToken = refreshTokenService.issue(user);
        return new LoginResponse(accessToken, refreshToken, toAuthUser(user));
    }
}
