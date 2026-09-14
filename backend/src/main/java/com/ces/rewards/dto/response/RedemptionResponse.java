package com.ces.rewards.dto.response;

import java.time.Instant;
import java.util.List;

public record RedemptionResponse(
        Long id,
        String reference,
        long totalPoints,
        long balanceAfter,
        Instant redeemedAt,
        String redeemedBy,
        List<RedemptionLineResponse> items
) {
}
