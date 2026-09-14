package com.ces.rewards.dto.response;

public record AuthUserResponse(
        Long id,
        String username,
        String fullName,
        String role
) {
}
