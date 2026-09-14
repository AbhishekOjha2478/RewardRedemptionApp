package com.ces.rewards.dto.response;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        AuthUserResponse user
) {
}
