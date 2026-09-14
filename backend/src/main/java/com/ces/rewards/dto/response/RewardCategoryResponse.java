package com.ces.rewards.dto.response;

import java.util.List;

public record RewardCategoryResponse(
        Long id,
        String name,
        String description,
        List<RewardItemResponse> items
) {
}
