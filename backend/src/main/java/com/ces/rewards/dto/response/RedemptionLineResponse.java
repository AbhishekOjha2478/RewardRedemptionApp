package com.ces.rewards.dto.response;

public record RedemptionLineResponse(
        String itemName,
        String categoryName,
        int quantity,
        int pointsCostEach,
        long lineTotal
) {
}
