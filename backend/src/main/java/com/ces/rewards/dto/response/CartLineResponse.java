package com.ces.rewards.dto.response;

public record CartLineResponse(
        Long cartItemId,
        Long rewardItemId,
        String itemName,
        String categoryName,
        int pointsCostEach,
        int quantity,
        long lineTotal
) {
}
