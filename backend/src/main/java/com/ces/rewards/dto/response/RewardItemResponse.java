package com.ces.rewards.dto.response;

public record RewardItemResponse(
        Long id,
        String name,
        String description,
        int pointsCost,
        Long categoryId,
        String categoryName
) {
}
