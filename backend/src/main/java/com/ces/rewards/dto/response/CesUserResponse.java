package com.ces.rewards.dto.response;

import java.time.Instant;

public record CesUserResponse(
        Long id,
        String username,
        String fullName,
        String email,
        String role,
        boolean active,
        Instant createdAt
) {
}
